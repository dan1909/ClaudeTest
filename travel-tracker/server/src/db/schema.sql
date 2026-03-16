CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  startDate TEXT,
  endDate TEXT,
  coverImageId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  tripId TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT DEFAULT '',
  arrivalDate TEXT,
  departureDate TEXT,
  notes TEXT DEFAULT '',
  orderIndex INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  tripId TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stopId TEXT REFERENCES stops(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storedFilename TEXT NOT NULL,
  thumbnailFilename TEXT,
  lat REAL,
  lng REAL,
  takenAt TEXT,
  cameraMake TEXT,
  cameraModel TEXT,
  width INTEGER,
  height INTEGER,
  fileSize INTEGER,
  sha256 TEXT
);

CREATE TABLE IF NOT EXISTS geocode_cache (
  lat_rounded TEXT NOT NULL,
  lng_rounded TEXT NOT NULL,
  result_json TEXT NOT NULL,
  PRIMARY KEY (lat_rounded, lng_rounded)
);

CREATE INDEX IF NOT EXISTS idx_stops_tripId ON stops(tripId);
CREATE INDEX IF NOT EXISTS idx_images_tripId ON images(tripId);
CREATE INDEX IF NOT EXISTS idx_images_stopId ON images(stopId);
