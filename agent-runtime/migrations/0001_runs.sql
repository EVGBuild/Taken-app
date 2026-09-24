CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  user_request TEXT NOT NULL,
  status TEXT NOT NULL,
  structured_result TEXT
);
