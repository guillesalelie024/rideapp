import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import { promisify } from 'node:util';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchCalapanWeather } from './weather.mjs';

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined });
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,capacitor://localhost,https://localhost').split(',').map((value) => value.trim());
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const maxTripStops = 30;
const placeIdPattern = /^[a-z0-9][a-z0-9-]{0,199}$/;
const appOrigin = (process.env.APP_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authWindows = new Map();
const weatherCacheMs = 300000;
let weatherCache;
let weatherCacheAt = 0;
let weatherRequest;

function limitAuthAttempts(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'local';
  const window = authWindows.get(key);
  if (!window || now - window.startedAt > 900000) {
    authWindows.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (window.count >= 20) return res.status(429).json({ error: 'Too many account requests. Try again in a few minutes.' });
  window.count += 1;
  next();
}

async function migrate() {
  const schemaUrl = new URL('./schema.sql', import.meta.url);
  await pool.query(await readFile(schemaUrl, 'utf8'));
}

function userDto(row) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    ...(row.created_at ? { memberSince: row.created_at.toISOString() } : {}),
  };
}
function issueToken() { return randomBytes(32).toString('base64url'); }
function tokenHash(token) { return createHash('sha256').update(token).digest('hex'); }

async function createSession(userId) {
  const token = issueToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await pool.query('INSERT INTO ride_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash(token), userId, expiresAt]);
  return { token, expiresAt: expiresAt.toISOString() };
}

const requireSession = asyncRoute(async (req, res, next) => {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer || bearer.length > 200) return res.status(401).json({ error: 'Please sign in to continue.' });
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.created_at, s.token_hash
     FROM ride_sessions s JOIN ride_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [tokenHash(bearer)],
  );
  if (!result.rowCount) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  req.user = result.rows[0];
  req.tokenHash = result.rows[0].token_hash;
  next();
});

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, database: 'connected' });
}));

app.get('/api/weather/calapan', asyncRoute(async (_req, res) => {
  if (weatherCache && Date.now() - weatherCacheAt < weatherCacheMs) {
    return res.json(weatherCache);
  }

  if (!weatherRequest) {
    weatherRequest = fetchCalapanWeather()
      .then((conditions) => {
        weatherCache = conditions;
        weatherCacheAt = Date.now();
        return conditions;
      })
      .finally(() => { weatherRequest = undefined; });
  }

  try {
    return res.json(await weatherRequest);
  } catch (error) {
    throw Object.assign(new Error('Calapan weather information is temporarily unavailable.'), {
      status: 502,
      cause: error,
    });
  }
}));

app.post('/api/auth/signup', limitAuthAttempts, asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 100) : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!name || !emailPattern.test(email) || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'Enter a name, valid email, and password with at least 8 characters.' });
  }
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)).toString('hex');
  let inserted;
  try {
    inserted = await pool.query(
      'INSERT INTO ride_users (full_name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, created_at',
      [name, email, salt, hash],
    );
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    throw error;
  }
  res.status(201).json({ user: userDto(inserted.rows[0]) });
}));

app.post('/api/auth/login', limitAuthAttempts, asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const result = await pool.query('SELECT id, full_name, email, created_at, password_salt, password_hash FROM ride_users WHERE email = $1', [email]);
  if (!result.rowCount || !password) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const user = result.rows[0];
  const candidate = await scrypt(password, user.password_salt, 64);
  const expected = Buffer.from(user.password_hash, 'hex');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const session = await createSession(user.id);
  res.json({ ...session, user: userDto(user) });
}));

app.post('/api/auth/logout', requireSession, asyncRoute(async (req, res) => {
  await pool.query('UPDATE ride_sessions SET revoked_at = now() WHERE token_hash = $1', [req.tokenHash]);
  res.sendStatus(204);
}));

async function deliverPasswordReset(email, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESET_FROM_EMAIL;
  if (!apiKey || !from) {
    console.info(`[RIDE] Password reset link for ${email}: ${resetUrl}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('[RIDE] RESEND_API_KEY and RESET_FROM_EMAIL must be set in production to deliver password reset email.');
    }
    return false;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Reset your RIDE password',
      text: `Open this link to choose a new RIDE password. It expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    }),
  });
  if (!response.ok) {
    console.error('Password reset email could not be sent:', response.status, await response.text());
    return false;
  }
  return true;
}

app.post('/api/auth/password-reset/request', limitAuthAttempts, asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const genericMessage = 'If an account exists for that email, a reset link has been sent.';
  if (email.length > 254 || !emailPattern.test(email)) return res.json({ message: genericMessage });
  const result = await pool.query('SELECT id, email FROM ride_users WHERE email = $1', [email]);
  if (!result.rowCount) return res.json({ message: genericMessage });

  const token = issueToken();
  await pool.query('DELETE FROM ride_password_resets WHERE user_id = $1 AND used_at IS NULL', [result.rows[0].id]);
  await pool.query(
    'INSERT INTO ride_password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash(token), result.rows[0].id, new Date(Date.now() + 1000 * 60 * 30)],
  );
  const resetUrl = `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;
  const sent = await deliverPasswordReset(email, resetUrl);
  res.json({
    message: genericMessage,
    ...(!sent && process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
  });
}));

app.post('/api/auth/password-reset/confirm', limitAuthAttempts, asyncRoute(async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (token.length < 20 || token.length > 200 || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'Enter a new password with at least 8 characters.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT id, user_id FROM ride_password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE',
      [tokenHash(token)],
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
    }
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)).toString('hex');
    await client.query('UPDATE ride_users SET password_salt = $1, password_hash = $2, updated_at = now() WHERE id = $3', [salt, hash, result.rows[0].user_id]);
    await client.query('UPDATE ride_password_resets SET used_at = now() WHERE id = $1', [result.rows[0].id]);
    await client.query('UPDATE ride_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [result.rows[0].user_id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  res.sendStatus(204);
}));

app.post('/api/auth/password', requireSession, limitAuthAttempts, asyncRoute(async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!currentPassword || newPassword.length < 8 || newPassword.length > 200) {
    return res.status(400).json({ error: 'Enter your current password and a new password with at least 8 characters.' });
  }
  const result = await pool.query('SELECT password_salt, password_hash FROM ride_users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  const candidate = await scrypt(currentPassword, user.password_salt, 64);
  const expected = Buffer.from(user.password_hash, 'hex');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    return res.status(401).json({ error: 'Your current password is incorrect.' });
  }
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(newPassword, salt, 64)).toString('hex');
  await pool.query('UPDATE ride_users SET password_salt = $1, password_hash = $2, updated_at = now() WHERE id = $3', [salt, hash, req.user.id]);
  await pool.query('UPDATE ride_sessions SET revoked_at = now() WHERE user_id = $1 AND token_hash <> $2 AND revoked_at IS NULL', [req.user.id, req.tokenHash]);
  res.sendStatus(204);
}));

app.get('/api/me', requireSession, (req, res) => res.json({ user: userDto(req.user) }));
app.patch('/api/me', requireSession, asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 100) : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!name) return res.status(400).json({ error: 'Enter your name.' });
  if (email.length > 254 || !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  let result;
  try {
    result = await pool.query(
      'UPDATE ride_users SET full_name = $1, email = $2, updated_at = now() WHERE id = $3 RETURNING id, full_name, email, created_at',
      [name, email, req.user.id],
    );
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    throw error;
  }
  res.json({ user: userDto(result.rows[0]) });
}));

function isPlaceId(value) {
  return typeof value === 'string' && placeIdPattern.test(value);
}
function isCuratedStop(value) {
  return Boolean(value)
    && typeof value === 'object'
    && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 160
    && typeof value.category === 'string' && value.category.length <= 80
    && (value.note === undefined || (typeof value.note === 'string' && value.note.length <= 1000));
}
function normalizeTrip(value) {
  if (!value || typeof value !== 'object' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id || '')) throw Object.assign(new Error('Invalid trip record.'), { status: 400 });
  if (!['upcoming', 'ongoing', 'completed', 'cancelled'].includes(value.status)) throw Object.assign(new Error('Invalid trip status.'), { status: 400 });
  const itinerary = value.itinerary;
  if (!itinerary || typeof itinerary !== 'object' || !Array.isArray(itinerary.stopIds)
    || itinerary.stopIds.length > maxTripStops
    || !itinerary.stopIds.every(isPlaceId)
    || new Set(itinerary.stopIds).size !== itinerary.stopIds.length) {
    throw Object.assign(new Error('Trips contain invalid stop data.'), { status: 400 });
  }
  if (itinerary.curatedStops !== undefined) {
    const curated = itinerary.curatedStops;
    if (!curated || typeof curated !== 'object' || Array.isArray(curated)) throw Object.assign(new Error('Trips contain invalid place details.'), { status: 400 });
    const entries = Object.entries(curated);
    if (entries.length > maxTripStops || entries.some(([id, stop]) => !isPlaceId(id) || !isCuratedStop(stop))) {
      throw Object.assign(new Error('Trips contain invalid place details.'), { status: 400 });
    }
  }
  if (value.visitedStopIds !== undefined && (!Array.isArray(value.visitedStopIds) || !value.visitedStopIds.every(isPlaceId))) {
    throw Object.assign(new Error('Trips contain invalid visited stops.'), { status: 400 });
  }
  if (value.selectedRoute !== undefined && value.selectedRoute !== null) {
    const route = value.selectedRoute;
    if (typeof route !== 'object' || (route.fromId !== undefined && !isPlaceId(route.fromId)) || (route.toId !== undefined && !isPlaceId(route.toId))) {
      throw Object.assign(new Error('Trips contain an invalid route.'), { status: 400 });
    }
  }
  return value;
}

function tripDto(row) {
  return {
    id: row.id, status: row.status, itinerary: row.itinerary, selectedRoute: row.selected_route ?? undefined,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    ...(row.started_at ? { startedAt: row.started_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.duration_ms !== null ? { durationMs: Number(row.duration_ms) } : {}),
    visitedStopIds: row.visited_stop_ids, ...(row.actual_expenses ? { actualExpenses: row.actual_expenses } : {}),
    receiptSaved: row.receipt_saved,
  };
}

app.get('/api/trips', requireSession, asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT * FROM ride_trips WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
  res.json({ trips: result.rows.map(tripDto) });
}));

app.put('/api/trips/:id', requireSession, asyncRoute(async (req, res) => {
  const trip = normalizeTrip({ ...req.body, id: req.params.id });
  const result = await pool.query(
    `INSERT INTO ride_trips (id, user_id, status, itinerary, selected_route, started_at, completed_at, duration_ms, visited_stop_ids, actual_expenses, receipt_saved, created_at, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, itinerary = EXCLUDED.itinerary, selected_route = EXCLUDED.selected_route,
       started_at = EXCLUDED.started_at, completed_at = EXCLUDED.completed_at, duration_ms = EXCLUDED.duration_ms,
       visited_stop_ids = EXCLUDED.visited_stop_ids, actual_expenses = EXCLUDED.actual_expenses,
       receipt_saved = EXCLUDED.receipt_saved, updated_at = now()
     WHERE ride_trips.user_id = EXCLUDED.user_id RETURNING *`,
    [trip.id, req.user.id, trip.status, JSON.stringify(trip.itinerary), JSON.stringify(trip.selectedRoute ?? null), trip.startedAt ?? null,
      trip.completedAt ?? null, trip.durationMs ?? null, JSON.stringify(trip.visitedStopIds ?? []), JSON.stringify(trip.actualExpenses ?? null),
      trip.receiptSaved === true, trip.createdAt ?? new Date().toISOString(), trip.updatedAt ?? new Date().toISOString()],
  );
  if (!result.rowCount) return res.status(409).json({ error: 'This trip ID belongs to another account.' });
  res.json({ trip: tripDto(result.rows[0]) });
}));

app.delete('/api/trips/:id', requireSession, asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM ride_trips WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.sendStatus(204);
}));

function savedPlaceDto(row) {
  return {
    placeId: row.place_id,
    kind: row.kind,
    ...(row.name ? { name: row.name } : {}),
    ...(row.category ? { category: row.category } : {}),
    ...(row.note ? { note: row.note } : {}),
    savedAt: row.saved_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function collectionDto(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    count: Number(row.count || 0),
    coverPlaceId: row.cover_place_id || null,
  };
}

function isPlaceKind(value) { return value === 'destination' || value === 'curated'; }

app.get('/api/saved', requireSession, asyncRoute(async (req, res) => {
  const [saved, collections, memberships] = await Promise.all([
    pool.query('SELECT place_id, kind, name, category, note, saved_at, updated_at FROM ride_saved_places WHERE user_id = $1 ORDER BY saved_at DESC', [req.user.id]),
    pool.query(`SELECT c.id, c.name, c.created_at, c.updated_at, COUNT(m.place_id)::int AS count,
        (SELECT m2.place_id FROM ride_saved_collection_places m2 WHERE m2.collection_id = c.id ORDER BY m2.added_at DESC LIMIT 1) AS cover_place_id
      FROM ride_saved_collections c LEFT JOIN ride_saved_collection_places m ON m.collection_id = c.id
      WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.updated_at DESC`, [req.user.id]),
    pool.query('SELECT collection_id, place_id FROM ride_saved_collection_places WHERE user_id = $1 ORDER BY added_at DESC', [req.user.id]),
  ]);
  const collectionPlaceIds = {};
  for (const row of memberships.rows) {
    if (!collectionPlaceIds[row.collection_id]) collectionPlaceIds[row.collection_id] = [];
    collectionPlaceIds[row.collection_id].push(row.place_id);
  }
  res.json({ places: saved.rows.map(savedPlaceDto), collections: collections.rows.map(collectionDto), collectionPlaceIds });
}));

app.put('/api/saved/:placeId', requireSession, asyncRoute(async (req, res) => {
  const placeId = String(req.params.placeId || '');
  if (!isPlaceId(placeId)) return res.status(400).json({ error: 'Invalid place identifier.' });
  const kind = isPlaceKind(req.body?.kind) ? req.body.kind : 'destination';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 160) : null;
  const category = typeof req.body?.category === 'string' ? req.body.category.trim().slice(0, 120) : null;
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : null;
  if (kind === 'curated' && !name) return res.status(400).json({ error: 'Curated places need a name.' });
  const result = await pool.query(
    `INSERT INTO ride_saved_places (user_id, place_id, kind, name, category, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, place_id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, category = EXCLUDED.category, note = EXCLUDED.note, updated_at = now()
     RETURNING place_id, kind, name, category, note, saved_at, updated_at`,
    [req.user.id, placeId, kind, name, category, note],
  );
  res.json({ place: savedPlaceDto(result.rows[0]) });
}));

app.delete('/api/saved/:placeId', requireSession, asyncRoute(async (req, res) => {
  const placeId = String(req.params.placeId || '');
  if (!isPlaceId(placeId)) return res.status(400).json({ error: 'Invalid place identifier.' });
  await pool.query('DELETE FROM ride_saved_places WHERE user_id = $1 AND place_id = $2', [req.user.id, placeId]);
  res.sendStatus(204);
}));

app.post('/api/saved/collections', requireSession, asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
  if (!name) return res.status(400).json({ error: 'Enter a collection name.' });
  const result = await pool.query(
    'INSERT INTO ride_saved_collections (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at, updated_at',
    [req.user.id, name],
  );
  res.status(201).json({ collection: collectionDto({ ...result.rows[0], count: 0, cover_place_id: null }) });
}));

app.patch('/api/saved/collections/:id', requireSession, asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
  if (!name) return res.status(400).json({ error: 'Enter a collection name.' });
  const result = await pool.query(
    'UPDATE ride_saved_collections SET name = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING id, name, created_at, updated_at',
    [name, req.params.id, req.user.id],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Collection not found.' });
  res.json({ collection: collectionDto({ ...result.rows[0], count: 0, cover_place_id: null }) });
}));

app.delete('/api/saved/collections/:id', requireSession, asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM ride_saved_collections WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.sendStatus(204);
}));

app.put('/api/saved/collections/:id/places/:placeId', requireSession, asyncRoute(async (req, res) => {
  const placeId = String(req.params.placeId || '');
  if (!isPlaceId(placeId)) return res.status(400).json({ error: 'Invalid place identifier.' });
  const collection = await pool.query('SELECT id FROM ride_saved_collections WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!collection.rowCount) return res.status(404).json({ error: 'Collection not found.' });
  await pool.query('INSERT INTO ride_saved_places (user_id, place_id, kind) VALUES ($1, $2, $3) ON CONFLICT (user_id, place_id) DO NOTHING', [req.user.id, placeId, 'destination']);
  await pool.query('INSERT INTO ride_saved_collection_places (collection_id, user_id, place_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [req.params.id, req.user.id, placeId]);
  await pool.query('UPDATE ride_saved_collections SET updated_at = now() WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
}));

app.delete('/api/saved/collections/:id/places/:placeId', requireSession, asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM ride_saved_collection_places WHERE collection_id = $1 AND user_id = $2 AND place_id = $3', [req.params.id, req.user.id, req.params.placeId]);
  await pool.query('UPDATE ride_saved_collections SET updated_at = now() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.sendStatus(204);
}));

/* ===== Route condition reports ===== */
function isReportCategory(value) {
  return ['flood', 'traffic', 'road_closure', 'transport_delay', 'other'].includes(value);
}
function isReportStatus(value) {
  return ['pending', 'verified', 'expired'].includes(value);
}
function normalizeCoordinate(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90 ? n : null;
}
function normalizeLongitude(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180 ? n : null;
}

app.get('/api/reports', asyncRoute(async (_req, res) => {
  const now = new Date().toISOString();
  const result = await pool.query(
    `SELECT r.id, r.user_id, r.category, r.location_name, r.latitude, r.longitude,
            r.description, r.status, r.reported_at, r.expires_at,
            u.full_name AS user_name
     FROM ride_reports r LEFT JOIN ride_users u ON u.id = r.user_id
     WHERE r.expires_at > $1
     ORDER BY r.reported_at DESC`,
    [now],
  );
  res.json({ reports: result.rows.map((row) => ({
    id: row.id, userId: row.user_id, userName: row.full_name,
    category: row.category, locationName: row.location_name,
    latitude: Number(row.latitude), longitude: Number(row.longitude),
    description: row.description, status: row.status,
    reportedAt: row.reported_at.toISOString(), expiresAt: row.expires_at.toISOString(),
  })) });
}));

app.post('/api/reports', requireSession, asyncRoute(async (req, res) => {
  const { category, locationName, latitude, longitude, description } = req.body || {};
  if (!isReportCategory(category)) return res.status(400).json({ error: 'Invalid report category.' });
  if (!locationName || typeof locationName !== 'string' || locationName.trim().length < 1 || locationName.trim().length > 200) {
    return res.status(400).json({ error: 'Enter a valid location name.' });
  }
  const lat = normalizeCoordinate(latitude);
  const lon = normalizeLongitude(longitude);
  if (lat === null || lon === null) return res.status(400).json({ error: 'Invalid coordinates.' });
  if (!description || typeof description !== 'string' || description.trim().length < 1 || description.trim().length > 1000) {
    return res.status(400).json({ error: 'Enter a description between 1 and 1000 characters.' });
  }
  const result = await pool.query(
    `INSERT INTO ride_reports (user_id, category, location_name, latitude, longitude, description)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [req.user.id, category, locationName.trim(), lat, lon, description.trim()],
  );
  res.status(201).json({ id: result.rows[0].id, message: 'Report submitted successfully.' });
}));

/* ===== Transportation queue reports ===== */
function isQueueLevel(value) {
  return ['short', 'moderate', 'long'].includes(value);
}

app.get('/api/queue-reports', asyncRoute(async (_req, res) => {
  const now = new Date().toISOString();
  const result = await pool.query(
    `SELECT q.id, q.user_id, q.location_name, q.latitude, q.longitude,
            q.queue_level, q.description, q.reported_at, q.expires_at,
            u.full_name AS user_name
     FROM ride_queue_reports q LEFT JOIN ride_users u ON u.id = q.user_id
     WHERE q.expires_at > $1
     ORDER BY q.reported_at DESC`,
    [now],
  );
  res.json({ reports: result.rows.map((row) => ({
    id: row.id, userId: row.user_id, userName: row.full_name,
    locationName: row.location_name, latitude: Number(row.latitude), longitude: Number(row.longitude),
    queueLevel: row.queue_level, description: row.description,
    reportedAt: row.reported_at.toISOString(), expiresAt: row.expires_at.toISOString(),
  })) });
}));

app.post('/api/queue-reports', requireSession, asyncRoute(async (req, res) => {
  const { locationName, latitude, longitude, queueLevel, description } = req.body || {};
  if (!isQueueLevel(queueLevel)) return res.status(400).json({ error: 'Invalid queue level.' });
  if (!locationName || typeof locationName !== 'string' || locationName.trim().length < 1 || locationName.trim().length > 200) {
    return res.status(400).json({ error: 'Enter a valid location name.' });
  }
  const lat = normalizeCoordinate(latitude);
  const lon = normalizeLongitude(longitude);
  if (lat === null || lon === null) return res.status(400).json({ error: 'Invalid coordinates.' });
  if (description && (typeof description !== 'string' || description.length > 1000)) {
    return res.status(400).json({ error: 'Description must be under 1000 characters.' });
  }
  const result = await pool.query(
    `INSERT INTO ride_queue_reports (user_id, location_name, latitude, longitude, queue_level, description)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [req.user.id, locationName.trim(), lat, lon, queueLevel, description ? description.trim() : null],
  );
  res.status(201).json({ id: result.rows[0].id, message: 'Queue report submitted successfully.' });
}));

/* ===== Trip ratings ===== */
app.get('/api/trip-ratings/:tripId', asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT r.rating, r.review, r.rated_at, u.full_name AS user_name
     FROM ride_trip_ratings r JOIN ride_users u ON u.id = r.user_id
     WHERE r.trip_id = $1 ORDER BY r.rated_at DESC`,
    [req.params.tripId],
  );
  res.json({ ratings: result.rows.map((row) => ({
    rating: row.rating, review: row.review, ratedAt: row.rated_at.toISOString(),
    userName: row.full_name,
  })) });
}));

app.post('/api/trip-ratings', requireSession, asyncRoute(async (req, res) => {
  const { tripId, rating, review } = req.body || {};
  if (!tripId || typeof tripId !== 'string') return res.status(400).json({ error: 'Trip ID is required.' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  if (review && typeof review !== 'string') return res.status(400).json({ error: 'Review must be text.' });
  const tripResult = await pool.query('SELECT id FROM ride_trips WHERE id = $1 AND user_id = $2', [tripId, req.user.id]);
  if (!tripResult.rowCount) return res.status(404).json({ error: 'Trip not found or does not belong to you.' });
  try {
    const result = await pool.query(
      `INSERT INTO ride_trip_ratings (trip_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4) RETURNING id, rating, review, rated_at`,
      [tripId, req.user.id, rating, review ? review.trim() : null],
    );
    res.status(201).json({ id: result.rows[0].id, rating: result.rows[0].rating, review: result.rows[0].review, ratedAt: result.rows[0].rated_at.toISOString() });
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'You have already rated this trip.' });
    throw error;
  }
}));

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({ error: status === 500 ? 'The server could not complete the request.' : error.message });
});

await migrate();
const server = app.listen(port, () => console.log(`RIDE API listening on http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
