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

CREATE TABLE IF NOT EXISTS ride_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ride_users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('flood', 'traffic', 'road_closure', 'transport_delay', 'other')),
  location_name TEXT NOT NULL CHECK (char_length(location_name) BETWEEN 1 AND 200),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);
CREATE INDEX IF NOT EXISTS ride_reports_category_idx ON ride_reports(category);
CREATE INDEX IF NOT EXISTS ride_reports_status_idx ON ride_reports(status);
CREATE INDEX IF NOT EXISTS ride_reports_location_idx ON ride_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS ride_reports_user_idx ON ride_reports(user_id);
CREATE INDEX IF NOT EXISTS ride_reports_reported_at_idx ON ride_reports(reported_at DESC);

CREATE TABLE IF NOT EXISTS ride_queue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ride_users(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL CHECK (char_length(location_name) BETWEEN 1 AND 200),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  queue_level TEXT NOT NULL CHECK (queue_level IN ('short', 'moderate', 'long')),
  description TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 days')
);
CREATE INDEX IF NOT EXISTS ride_queue_reports_location_idx ON ride_queue_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS ride_queue_reports_level_idx ON ride_queue_reports(queue_level);
CREATE INDEX IF NOT EXISTS ride_queue_reports_user_idx ON ride_queue_reports(user_id);
CREATE INDEX IF NOT EXISTS ride_queue_reports_reported_at_idx ON ride_queue_reports(reported_at DESC);

CREATE TABLE IF NOT EXISTS ride_trip_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES ride_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  rated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);
CREATE INDEX IF NOT EXISTS ride_trip_ratings_trip_idx ON ride_trip_ratings(trip_id);
CREATE INDEX IF NOT EXISTS ride_trip_ratings_user_idx ON ride_trip_ratings(user_id);
CREATE INDEX IF NOT EXISTS ride_trip_ratings_rating_idx ON ride_trip_ratings(rating);

CREATE TABLE IF NOT EXISTS ride_saved_places (
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL CHECK (char_length(place_id) BETWEEN 1 AND 200),
  kind TEXT NOT NULL CHECK (kind IN ('destination', 'curated')),
  name TEXT,
  category TEXT,
  note TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);
CREATE INDEX IF NOT EXISTS ride_saved_places_user_saved_idx ON ride_saved_places(user_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS ride_saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ride_saved_collections_user_updated_idx ON ride_saved_collections(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ride_saved_collection_places (
  collection_id UUID NOT NULL REFERENCES ride_saved_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ride_users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, place_id),
  CONSTRAINT ride_saved_collection_places_user_id_place_id_fkey
    FOREIGN KEY (user_id, place_id) REFERENCES ride_saved_places(user_id, place_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ride_saved_collection_places_collection_idx ON ride_saved_collection_places(collection_id, added_at DESC);

DO $$
BEGIN
  IF to_regclass('public.ride_saved_collection_places') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'ride_saved_collection_places'::regclass
         AND contype = 'f'
         AND conname = 'ride_saved_collection_places_user_id_place_id_fkey'
     ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'ride_saved_collection_places'::regclass
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%FOREIGN KEY (user_id, place_id) REFERENCES ride_saved_places(user_id, place_id)%'
    ) THEN
      ALTER TABLE ride_saved_collection_places DROP CONSTRAINT IF EXISTS ride_saved_collection_places_place_id_fkey;
      ALTER TABLE ride_saved_collection_places
        ADD CONSTRAINT ride_saved_collection_places_user_id_place_id_fkey
        FOREIGN KEY (user_id, place_id) REFERENCES ride_saved_places(user_id, place_id) ON DELETE CASCADE;
    END IF;
  END IF;
END
$$;
