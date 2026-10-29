-- Tables and reference data only, no player data. Loaded into a new database.
CREATE TABLE IF NOT EXISTS clicks (
  player VARCHAR(64) NOT NULL PRIMARY KEY,
  total INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
