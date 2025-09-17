-- Provably Fair System Database Schema

-- Server seeds table
CREATE TABLE IF NOT EXISTS server_seeds (
    id TEXT PRIMARY KEY,
    seed TEXT NOT NULL,
    hashed_seed TEXT NOT NULL,
    is_revealed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    revealed_at TEXT
);

-- Client seeds table
CREATE TABLE IF NOT EXISTS client_seeds (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seed TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Game results table for verification
CREATE TABLE IF NOT EXISTS game_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    server_seed_id TEXT NOT NULL,
    client_seed_id TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (server_seed_id) REFERENCES server_seeds (id),
    FOREIGN KEY (client_seed_id) REFERENCES client_seeds (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_server_seeds_revealed ON server_seeds (is_revealed);
CREATE INDEX IF NOT EXISTS idx_client_seeds_user ON client_seeds (user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user ON game_results (user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results (game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_type ON game_results (game_type);
CREATE INDEX IF NOT EXISTS idx_game_results_created ON game_results (created_at);
