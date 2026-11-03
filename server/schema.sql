CREATE TABLE IF NOT EXISTS ride_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ride_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ride_sessions_user_id_idx ON ride_sessions(user_id);

CREATE TABLE IF NOT EXISTS ride_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ride_password_resets_user_id_idx ON ride_password_resets(user_id);

CREATE TABLE IF NOT EXISTS ride_trips (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  itinerary JSONB NOT NULL,
  selected_route JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms BIGINT CHECK (duration_ms IS NULL OR duration_ms >= 0),
  visited_stop_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  actual_expenses JSONB,
  receipt_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ride_trips_user_updated_idx ON ride_trips(user_id, updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ride_trips'::regclass
      AND conname = 'ride_trips_status_check'
      AND pg_get_constraintdef(oid) LIKE '%cancelled%'
  ) THEN
    ALTER TABLE ride_trips DROP CONSTRAINT IF EXISTS ride_trips_status_check;
    ALTER TABLE ride_trips
      ADD CONSTRAINT ride_trips_status_check
      CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));
  END IF;
END
$$;
