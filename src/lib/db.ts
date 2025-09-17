// Simple file-backed SQLite in WASM (sql.js) for local dev usage.
// This avoids native build tooling on Windows. Not for production.

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DB_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'equipgg.sqlite');

async function ensureLoaded(): Promise<void> {
  if (!SQL) {
    try {
      console.log('🔄 Initializing SQL.js...');
      
      // Try multiple WASM paths
      const possiblePaths = [
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist'),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        path.join(process.cwd(), 'public', 'sql-wasm.wasm')
      ];

      let wasmPath = possiblePaths[0];
      
      // Check if WASM file exists
      const fs = require('fs');
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          wasmPath = testPath;
          console.log('✅ Found WASM at:', wasmPath);
          break;
        }
      }

      SQL = await initSqlJs({ 
        locateFile: (file: string) => {
          const fullPath = path.join(wasmPath, file);
          console.log('🔍 Looking for WASM file:', fullPath);
          return fullPath;
        },
        onAbort: (reason: string) => {
          console.error('❌ SQL.js WASM aborted:', reason);
        }
      });
      
      console.log('✅ SQL.js initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQL.js:', error);
      console.log('🔄 Falling back to mock database for development...');
      
      // Create a more robust mock SQL object
      SQL = {
        Database: class MockDatabase {
          constructor() {
            console.log('📦 Using mock database');
          }
          exec() { return []; }
          run() { return { changes: 0, lastInsertRowid: 0 }; }
          get() { return null; }
          all() { return []; }
          prepare() { 
            return {
              run: () => ({ changes: 0, lastInsertRowid: 0 }),
              get: () => null,
              all: () => [],
              step: () => false,
              getAsObject: () => ({}),
              bind: () => {},
              free: () => {},
              finalize: () => {}
            };
          }
          close() {}
        }
      } as any;
    }
  }
}

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

let migrationCompleted = false; // Reset to run displayName migration with fixed syntax

function migrateDatabase(database: Database): void {
  if (migrationCompleted) {
    return; // Skip migration if already completed
  }
  console.log('🔄 Starting database migration...');
  
  // Migration 1: Check if site_settings needs to be migrated to new schema
  try {
    // Check if the table has the new schema by looking at the table info
    const tableInfo = database.exec("PRAGMA table_info(site_settings)");
    const hasNewSchema = tableInfo.length > 0 && tableInfo[0].values.some((row: any) => row[1] === 'setting_key');
    
    if (hasNewSchema) {
      console.log('✅ site_settings table already has new schema');
    } else {
      console.log('🔄 Migrating site_settings table to new schema...');
      
      // Create new table with new schema
      database.run(`
        CREATE TABLE IF NOT EXISTS site_settings_new (
          id TEXT PRIMARY KEY,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          setting_type TEXT NOT NULL DEFAULT 'string',
          description TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Migrate existing data
      try {
        const oldData = database.exec('SELECT * FROM site_settings WHERE id = 1');
        if (oldData.length > 0 && oldData[0].values.length > 0) {
          const row = oldData[0].values[0];
          const now = new Date().toISOString();
          
          // Migrate existing data to new format
          const migrations = [
            { id: 'setting_logo_url', key: 'logo_url', value: row[1] || '/logo.png', type: 'string', desc: 'Site logo URL' },
            { id: 'setting_message_of_the_day', key: 'message_of_the_day', value: row[2] || 'Welcome to EquipGG.net!', type: 'string', desc: 'Message of the day' },
            { id: 'setting_betting_enabled', key: 'betting_enabled', value: row[3] ? 'true' : 'false', type: 'boolean', desc: 'Enable betting features' },
            { id: 'setting_shop_enabled', key: 'shop_enabled', value: row[4] ? 'true' : 'false', type: 'boolean', desc: 'Enable shop features' },
            { id: 'setting_arcade_enabled', key: 'arcade_enabled', value: row[5] ? 'true' : 'false', type: 'boolean', desc: 'Enable arcade features' },
            { id: 'setting_forums_enabled', key: 'forums_enabled', value: row[6] ? 'true' : 'false', type: 'boolean', desc: 'Enable forums features' },
            { id: 'setting_maintenance_mode', key: 'maintenance_mode', value: row[7] ? 'true' : 'false', type: 'boolean', desc: 'Maintenance mode status' }
          ];
          
          migrations.forEach(migration => {
            database.run(`
              INSERT OR IGNORE INTO site_settings_new (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [migration.id, migration.key, migration.value, migration.type, migration.desc, now, now]);
          });
        }
      } catch (migrateError) {
        console.log('No existing data to migrate, using defaults');
      }
      
      // Drop old table and rename new one
      database.run('DROP TABLE IF EXISTS site_settings');
      database.run('ALTER TABLE site_settings_new RENAME TO site_settings');
      console.log('✅ site_settings table migrated successfully');
    }
  } catch (error) {
    console.log('🔄 Creating new site_settings table...');
    // Table doesn't exist, create it with new schema
    database.run(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default data
    const now = new Date().toISOString();
    const defaultSettings = [
      { id: 'setting_logo_url', key: 'logo_url', value: '/logo.svg', type: 'string', desc: 'Site logo URL' },
      { id: 'setting_message_of_the_day', key: 'message_of_the_day', value: 'Welcome to EquipGG.net!', type: 'string', desc: 'Message of the day' },
      { id: 'setting_betting_enabled', key: 'betting_enabled', value: 'true', type: 'boolean', desc: 'Enable betting features' },
      { id: 'setting_shop_enabled', key: 'shop_enabled', value: 'true', type: 'boolean', desc: 'Enable shop features' },
      { id: 'setting_arcade_enabled', key: 'arcade_enabled', value: 'true', type: 'boolean', desc: 'Enable arcade features' },
      { id: 'setting_forums_enabled', key: 'forums_enabled', value: 'true', type: 'boolean', desc: 'Enable forums features' },
      { id: 'setting_maintenance_mode', key: 'maintenance_mode', value: 'false', type: 'boolean', desc: 'Maintenance mode status' }
    ];
    
    defaultSettings.forEach(setting => {
      database.run(`
        INSERT OR IGNORE INTO site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [setting.id, setting.key, setting.value, setting.type, setting.desc, now, now]);
    });
    
    console.log('✅ site_settings table created with default data');
  }
  
  // Migration 2: Check if matches table needs to be updated with new columns
  try {
    const matchesTableInfo = database.exec("PRAGMA table_info(matches)");
    if (matchesTableInfo.length === 0) {
      console.log('🔄 Creating matches table with new schema...');
      // Table doesn't exist, create it with new schema
      database.run(`
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          team_a_name TEXT NOT NULL,
          team_a_logo TEXT,
          team_a_odds REAL NOT NULL DEFAULT 1.0,
          team_b_name TEXT NOT NULL,
          team_b_logo TEXT,
          team_b_odds REAL NOT NULL DEFAULT 1.0,
          event_name TEXT NOT NULL,
          map TEXT,
          start_time TEXT,
          match_date TEXT,
          stream_url TEXT,
          status TEXT NOT NULL DEFAULT 'upcoming',
          winner TEXT,
          pandascore_id INTEGER UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ matches table created with new schema');
    } else {
      // Table exists, check for missing columns
      const columns = matchesTableInfo[0].values.map((row: any) => row[1]);
      const hasWinnerColumn = columns.includes('winner');
      const hasPandascoreIdColumn = columns.includes('pandascore_id');
      const hasStreamUrlColumn = columns.includes('stream_url');
      
      if (!hasWinnerColumn) {
        console.log('🔄 Adding winner column to matches table...');
        database.run('ALTER TABLE matches ADD COLUMN winner TEXT');
      }
      
      if (!hasPandascoreIdColumn) {
        console.log('🔄 Adding pandascore_id column to matches table...');
        database.run('ALTER TABLE matches ADD COLUMN pandascore_id INTEGER UNIQUE');
      }
      
      if (!hasStreamUrlColumn) {
        console.log('🔄 Adding stream_url column to matches table...');
        database.run('ALTER TABLE matches ADD COLUMN stream_url TEXT');
      }
      
      if (hasWinnerColumn && hasPandascoreIdColumn && hasStreamUrlColumn) {
        console.log('✅ matches table already has all required columns');
      } else {
        console.log('✅ matches table updated with new columns');
      }
    }
  } catch (error) {
    console.log('🔄 Creating matches table with new schema...');
    // Table doesn't exist, create it with new schema
    database.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        team_a_name TEXT NOT NULL,
        team_a_logo TEXT,
        team_a_odds REAL NOT NULL DEFAULT 1.0,
        team_b_name TEXT NOT NULL,
        team_b_logo TEXT,
        team_b_odds REAL NOT NULL DEFAULT 1.0,
        event_name TEXT NOT NULL,
        map TEXT,
        start_time TEXT,
        match_date TEXT,
        stream_url TEXT,
        status TEXT NOT NULL DEFAULT 'upcoming',
        winner TEXT,
        pandascore_id INTEGER UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ matches table created with new schema');
  }
  
  // Migration: Fix gems default value for existing users
  database.run('UPDATE users SET gems = 0 WHERE gems = 50 AND role = "user"');
  console.log('✅ Fixed gems default value for normal users');
  
  // Migration: Add completed_at column to user_mission_progress if it doesn't exist
  try {
    const columns = database.exec("PRAGMA table_info(user_mission_progress)");
    const hasCompletedAt = columns.length > 0 && columns[0].values.some((col: any) => col[1] === 'completed_at');
    
    if (!hasCompletedAt) {
      console.log('✅ Adding completed_at column to user_mission_progress...');
      database.run('ALTER TABLE user_mission_progress ADD COLUMN completed_at TEXT');
    } else {
      console.log('✅ user_mission_progress table already has completed_at column');
    }
  } catch (error) {
    console.error('❌ completed_at migration error:', error);
  }
  
  // Migration: Fix displayName column issue
  try {
    const usersColumns = database.exec("PRAGMA table_info(users)");
    const hasDisplayName = usersColumns.length > 0 && usersColumns[0].values.some((col: any) => col[1] === 'displayName');
    const hasDisplayNameOld = usersColumns.length > 0 && usersColumns[0].values.some((col: any) => col[1] === 'display_name');
    
    if (hasDisplayNameOld && hasDisplayName) {
      console.log('✅ Migrating display_name to displayName...');
      // Copy data from display_name to displayName where displayName is null
      database.run(`
        UPDATE users SET displayName = display_name WHERE displayName IS NULL AND display_name IS NOT NULL;
      `);
      // Drop the old display_name column
      database.run(`
        CREATE TABLE users_new AS SELECT id, email, password_hash, displayName, avatar_url, role, xp, level, coins, gems, created_at, createdAt, lastLoginAt FROM users;
      `);
      database.run(`DROP TABLE users;`);
      database.run(`ALTER TABLE users_new RENAME TO users;`);
    } else if (hasDisplayNameOld && !hasDisplayName) {
      console.log('✅ Renaming display_name to displayName...');
      database.run(`
        CREATE TABLE users_new AS SELECT id, email, password_hash, display_name as displayName, avatar_url, role, xp, level, coins, gems, created_at, createdAt, lastLoginAt FROM users;
      `);
      database.run(`DROP TABLE users;`);
      database.run(`ALTER TABLE users_new RENAME TO users;`);
    }
  } catch (error) {
    console.error('❌ DisplayName migration error:', error);
  }
  
  console.log('✅ Database migration completed');
  migrationCompleted = true;
}

function ensureTablesExist(database: Database): void {
  // Create support ticket tables if they don't exist
  database.run(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (assigned_to) REFERENCES users (id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS support_ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      read BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'daily',
      tier INTEGER NOT NULL DEFAULT 1,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      coin_reward INTEGER NOT NULL DEFAULT 0,
      gem_reward INTEGER NOT NULL DEFAULT 0,
      crate_reward TEXT,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS user_mission_progress (
      user_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT 0,
      completed_at TEXT,
      last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, mission_id),
      FOREIGN KEY (mission_id) REFERENCES missions (id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      coin_reward INTEGER NOT NULL DEFAULT 0,
      gem_reward INTEGER NOT NULL DEFAULT 0,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL DEFAULT 1,
      icon TEXT,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function ensureUsersExist(database: Database): void {
  const now = new Date().toISOString();
  const bcrypt = require('bcryptjs');
  
  // Ensure admin user exists
  const adminId = 'admin-123-456-789';
  const adminPassword = 'admin123';
  const adminHashedPassword = bcrypt.hashSync(adminPassword, 10);
  
  const adminExists = database.prepare('SELECT id FROM users WHERE id = ?').get([adminId]);
  if (!adminExists) {
    console.log('Creating admin user...');
    const adminStmt = database.prepare(`
      INSERT INTO users (
        id, email, password_hash, displayName, role, xp, level, 
        coins, gems, created_at, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    adminStmt.run([
      adminId, 'admin@example.com', adminHashedPassword, 'Admin User', 'admin',
      0, 1, 0, 50, now, now
    ]);
    adminStmt.free();
  }
  
  // Ensure moderator user exists
  const moderatorId = 'moderator-123-456-789';
  const moderatorPassword = 'moderator123';
  const moderatorHashedPassword = bcrypt.hashSync(moderatorPassword, 10);
  
  const moderatorExists = database.prepare('SELECT id FROM users WHERE id = ?').get([moderatorId]);
  if (!moderatorExists) {
    console.log('Creating moderator user...');
    const moderatorStmt = database.prepare(`
      INSERT INTO users (
        id, email, password_hash, displayName, role, xp, level, 
        coins, gems, created_at, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    moderatorStmt.run([
      moderatorId, 'moderator@example.com', moderatorHashedPassword, 'Moderator User', 'moderator',
      0, 1, 0, 50, now, now
    ]);
    moderatorStmt.free();
  }
  
  // Ensure test user exists
  const userId = 'user-123-456-789';
  const userPassword = 'user123';
  const userHashedPassword = bcrypt.hashSync(userPassword, 10);
  
  const userExists = database.prepare('SELECT id FROM users WHERE id = ?').get([userId]);
  if (!userExists) {
    console.log('Creating test user...');
    const userStmt = database.prepare(`
      INSERT INTO users (
        id, email, password_hash, displayName, role, xp, level, 
        coins, gems, created_at, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    userStmt.run([
      userId, 'user@example.com', userHashedPassword, 'Test User', 'user',
      0, 1, 0, 0, now, now
    ]);
    userStmt.free();
  }
}

function ensureAdminRole(): void {
  if (!db) return;
  
  // Always ensure all default users exist with correct roles
  const bcrypt = require('bcryptjs');
  const now = new Date().toISOString();
  
  // Ensure admin user exists
  const adminId = '15e06c6d-c8b6-4c47-959a-65b6ed2b540c';
  const adminPassword = 'admin123';
  const adminHashedPassword = bcrypt.hashSync(adminPassword, 10);
  
  const adminStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  adminStmt.run([
    adminId, 'admin@example.com', adminHashedPassword, 'Admin User', 'admin',
    0, 1, 0, 50, now, now
  ]);
  adminStmt.free();
  
  // Ensure moderator user exists
  const moderatorId = 'moderator-123-456-789';
  const moderatorPassword = 'moderator123';
  const moderatorHashedPassword = bcrypt.hashSync(moderatorPassword, 10);
  
  const moderatorStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  moderatorStmt.run([
    moderatorId, 'moderator@example.com', moderatorHashedPassword, 'Moderator User', 'moderator',
    0, 1, 0, 50, now, now
  ]);
  moderatorStmt.free();
  
  // Ensure test user exists
  const userId = 'user-123-456-789';
  const userPassword = 'user123';
  const userHashedPassword = bcrypt.hashSync(userPassword, 10);
  
  const userStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  userStmt.run([
    userId, 'user@example.com', userHashedPassword, 'Test User', 'user',
    0, 1, 0, 0, now, now
  ]);
  userStmt.free();
  
  // Only persist when creating new database, not when loading existing one
  if (!fs.existsSync(DB_FILE)) {
    persist();
  }
}

let dbLoaded = false;
let dbLoading = false;
let dbMutex = false;

export async function getDb(): Promise<Database> {
  // If database is already loaded, return it
  if (db && dbLoaded) {
    return db;
  }
  
  // If database is currently loading, wait for it
  if (dbLoading) {
    let attempts = 0;
    while (dbLoading && attempts < 50) { // Wait up to 5 seconds
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (db && dbLoaded) {
      return db;
    }
  }
  
  // Start loading the database
  dbLoading = true;
  
  try {
    await ensureLoaded();
    ensureDir();
    
    if (fs.existsSync(DB_FILE)) {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL!.Database(filebuffer);
      // Run migrations first, then ensure all tables exist
      migrateDatabase(db);
      ensureTablesExist(db);
      // Ensure admin, moderator, and test users exist (but don't overwrite existing data)
      ensureUsersExist(db);
      // Don't persist here as it might overwrite existing data
    } else {
      db = new SQL!.Database();
      bootstrap(db);
      migrateDatabase(db);
      persist();
    }
    
    dbLoaded = true;
    return db;
  } catch (error) {
    console.error('❌ Failed to load database:', error);
    // Return a mock database to prevent crashes
    if (!db) {
      db = new SQL!.Database();
    }
    dbLoaded = true;
    return db;
  } finally {
    dbLoading = false;
  }
}

// Synchronous version for use in API routes
export function getDbSync(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return db;
}

export function persist(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export function clearCache(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function bootstrap(database: Database): void {
  database.run(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      displayName TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      coins INTEGER NOT NULL DEFAULT 0,
      gems INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLoginAt TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'daily',
      tier INTEGER NOT NULL DEFAULT 1,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      coin_reward INTEGER NOT NULL DEFAULT 0,
      gem_reward INTEGER NOT NULL DEFAULT 0,
      crate_reward TEXT,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_mission_progress (
      user_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT 0,
      completed_at TEXT,
      last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, mission_id),
      FOREIGN KEY (mission_id) REFERENCES missions (id)
    );

    CREATE TABLE IF NOT EXISTS user_inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      rarity TEXT NOT NULL,
      image_url TEXT,
      value INTEGER NOT NULL DEFAULT 0,
      equipped BOOLEAN NOT NULL DEFAULT 0,
      slot_type TEXT,
      acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'coins',
      description TEXT,
      item_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_bets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      odds REAL NOT NULL,
      potential_payout INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      payout INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_crates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      crate_id TEXT NOT NULL,
      crate_name TEXT NOT NULL,
      key_required TEXT,
      acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      crate_id TEXT NOT NULL,
      keys_count INTEGER NOT NULL DEFAULT 0,
      acquired_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, crate_id)
    );

    CREATE TABLE IF NOT EXISTS user_perks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      perk_id TEXT NOT NULL,
      perk_name TEXT NOT NULL,
      perk_type TEXT NOT NULL,
      duration_hours INTEGER,
      expires_at TEXT,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      content TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, match_id)
    );

    CREATE TABLE IF NOT EXISTS match_vote_stats (
      match_id TEXT PRIMARY KEY,
      team1_votes INTEGER NOT NULL DEFAULT 0,
      team2_votes INTEGER NOT NULL DEFAULT 0,
      total_votes INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      bet_amount INTEGER NOT NULL,
      winnings INTEGER NOT NULL DEFAULT 0,
      profit INTEGER NOT NULL,
      multiplier REAL,
      game_data TEXT,
      result TEXT NOT NULL,
      tiles_cleared INTEGER NOT NULL DEFAULT 0,
      xp_gained INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coinflip_lobbies (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      joiner_id TEXT,
      bet_amount INTEGER NOT NULL,
      side TEXT NOT NULL CHECK (side IN ('heads', 'tails')),
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'completed', 'expired')),
      winner_id TEXT,
      flip_result TEXT CHECK (flip_result IN ('heads', 'tails')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (creator_id) REFERENCES users (id),
      FOREIGN KEY (joiner_id) REFERENCES users (id),
      FOREIGN KEY (winner_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS user_moderation (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      moderator_id TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS forum_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      topic_count INTEGER NOT NULL DEFAULT 0,
      post_count INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      reply_count INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES forum_categories (id),
      FOREIGN KEY (author_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS user_activity_feed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_data TEXT,
      amount INTEGER,
      item_name TEXT,
      item_rarity TEXT,
      game_type TEXT,
      multiplier REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      coin_reward INTEGER NOT NULL DEFAULT 0,
      gem_reward INTEGER NOT NULL DEFAULT 0,
      requirement_type TEXT NOT NULL,
      requirement_value INTEGER NOT NULL DEFAULT 1,
      icon TEXT,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (achievement_id) REFERENCES achievements (id)
    );

    CREATE TABLE IF NOT EXISTS cs2_skin_deliveries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skin_id TEXT NOT NULL,
      skin_name TEXT NOT NULL,
      gems_paid INTEGER NOT NULL,
      steam_id TEXT NOT NULL,
      steam_trade_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      trade_offer_id TEXT,
      delivered_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS gem_settings (
      id INTEGER PRIMARY KEY,
      gemShopEnabled BOOLEAN NOT NULL DEFAULT 1,
      cs2SkinsEnabled BOOLEAN NOT NULL DEFAULT 1,
      exchangeEnabled BOOLEAN NOT NULL DEFAULT 1,
      dailyExchangeLimit INTEGER NOT NULL DEFAULT 10000,
      maxExchangePerTransaction INTEGER NOT NULL DEFAULT 1000,
      gemShopMaintenance BOOLEAN NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY,
      coinsToGems INTEGER NOT NULL DEFAULT 1000,
      gemsToCoins INTEGER NOT NULL DEFAULT 800
    );

    CREATE TABLE IF NOT EXISTS gem_packages (
      id TEXT PRIMARY KEY,
      gems INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      name TEXT NOT NULL,
      description TEXT,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cs2_skins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      gems INTEGER NOT NULL,
      steamMarketPrice DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_settings (
      id INTEGER PRIMARY KEY,
      stripePublicKey TEXT,
      stripeSecretKey TEXT,
      paypalClientId TEXT,
      paypalClientSecret TEXT,
      webhookSecret TEXT,
      enabled BOOLEAN NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gem_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      description TEXT NOT NULL,
      gems_paid INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS payment_intents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'requires_payment_method',
      stripe_payment_intent_id TEXT,
      client_secret TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Landing page management tables
    CREATE TABLE IF NOT EXISTS flash_sales (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      discount_percentage INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS featured_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      item_type TEXT,
      rarity TEXT,
      price REAL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      setting_type TEXT NOT NULL DEFAULT 'string',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS theme_settings (
      id INTEGER PRIMARY KEY,
      primary_color TEXT NOT NULL DEFAULT '#F08000',
      accent_color TEXT NOT NULL DEFAULT '#FFB347',
      background_color TEXT NOT NULL DEFAULT '#1A1A1A',
      custom_css TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS connection_settings (
      id INTEGER PRIMARY KEY,
      steam_api_key TEXT DEFAULT '',
      pandascore_api_key TEXT DEFAULT 'k6acJFiAUbzU7tPstkUFcYfRTq1JpvjTG_5TK6-zYiMEYjPKrjI'
    );

    CREATE TABLE IF NOT EXISTS landing_settings (
      id INTEGER PRIMARY KEY,
      hero_title TEXT DEFAULT 'Welcome to EquipGG.net',
      hero_subtitle TEXT DEFAULT 'The ultimate CS2 betting and trading platform',
      featured_text TEXT DEFAULT 'Discover amazing skins and items',
      stats_text TEXT DEFAULT 'Join thousands of players worldwide'
    );

    CREATE TABLE IF NOT EXISTS landing_panels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT 1,
      settings TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS landing_sliders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      auto_play BOOLEAN NOT NULL DEFAULT 1,
      interval INTEGER NOT NULL DEFAULT 5000,
      position INTEGER NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      team_a_name TEXT NOT NULL,
      team_a_logo TEXT,
      team_a_odds REAL NOT NULL DEFAULT 1.0,
      team_b_name TEXT NOT NULL,
      team_b_logo TEXT,
      team_b_odds REAL NOT NULL DEFAULT 1.0,
      event_name TEXT NOT NULL,
      map TEXT,
      start_time TEXT,
      match_date TEXT,
      stream_url TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming',
      winner TEXT,
      pandascore_id INTEGER UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      item_type TEXT NOT NULL DEFAULT 'weapon',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reward_type TEXT NOT NULL,
      reward_value INTEGER NOT NULL,
      required_level INTEGER,
      active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (assigned_to) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS support_ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      read BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS private_messages (
      id TEXT PRIMARY KEY,
      from_user_id TEXT,
      to_user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'news', 'update', 'admin_announcement', 'mod_announcement', 'system_notification')),
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users (id),
      FOREIGN KEY (to_user_id) REFERENCES users (id)
    );

    -- Ensure all required tables exist (removed duplicates)

    CREATE TABLE IF NOT EXISTS landing_settings (
      id INTEGER PRIMARY KEY,
      hero_title TEXT DEFAULT 'Welcome to EquipGG.net',
      hero_subtitle TEXT DEFAULT 'The ultimate CS2 betting and trading platform',
      featured_text TEXT DEFAULT 'Discover amazing skins and items',
      stats_text TEXT DEFAULT 'Join thousands of players worldwide'
    );
  `);

  // Always ensure all default users exist with correct roles
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const now = new Date().toISOString();
  
  // Create admin user
  const adminId = '15e06c6d-c8b6-4c47-959a-65b6ed2b540c';
  const adminPassword = 'admin123';
  const adminHashedPassword = bcrypt.hashSync(adminPassword, 10);
  
  database.run(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    adminId,
    'admin@example.com',
    adminHashedPassword,
    'Admin User',
    'admin',
    0, 1, 0, 50, now, now
  ]);
  
  // Create moderator user
  const moderatorId = uuidv4();
  const moderatorPassword = 'moderator123';
  const moderatorHashedPassword = bcrypt.hashSync(moderatorPassword, 10);
  
  database.run(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    moderatorId,
    'moderator@example.com',
    moderatorHashedPassword,
    'Moderator User',
    'moderator',
    0, 1, 0, 50, now, now
  ]);
  
  // Create test user
  const userId = uuidv4();
  const userPassword = 'user123';
  const userHashedPassword = bcrypt.hashSync(userPassword, 10);
  
  database.run(`
    INSERT OR REPLACE INTO users (
      id, email, password_hash, displayName, role, xp, level, 
      coins, gems, created_at, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId,
    'user@example.com',
    userHashedPassword,
    'Test User',
    'user',
    0, 1, 0, 50, now, now
  ]);
  
  // Add default landing page panels
  const defaultPanels = [
    {
      id: 'panel_hero_1',
      name: 'Hero Section',
      type: 'hero',
      position: 0,
      is_visible: 1,
      settings: JSON.stringify({ title: 'Level Up Your Game', subtitle: 'The ultimate CS2 virtual betting and gaming platform' })
    },
    {
      id: 'panel_flash_sale_1',
      name: 'Flash Sale Banner',
      type: 'flash_sale',
      position: 1,
      is_visible: 1,
      settings: JSON.stringify({})
    },
    {
      id: 'panel_stats_1',
      name: 'Live Statistics',
      type: 'stats',
      position: 2,
      is_visible: 1,
      settings: JSON.stringify({})
    },
    {
      id: 'panel_featured_1',
      name: 'Featured Items',
      type: 'featured_items',
      position: 3,
      is_visible: 1,
      settings: JSON.stringify({})
    },
    {
      id: 'panel_leaderboard_1',
      name: 'Leaderboard',
      type: 'leaderboard',
      position: 4,
      is_visible: 1,
      settings: JSON.stringify({})
    },
    {
      id: 'panel_activity_1',
      name: 'Activity Feed',
      type: 'activity_feed',
      position: 5,
      is_visible: 1,
      settings: JSON.stringify({})
    }
  ];

  defaultPanels.forEach(panel => {
    database.run(`
      INSERT OR IGNORE INTO landing_panels (id, name, type, position, is_visible, settings, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      panel.id,
      panel.name,
      panel.type,
      panel.position,
      panel.is_visible,
      panel.settings,
      now
    ]);
  });

  // Add default landing page sliders
  const defaultSliders = [
    {
      id: 'slider_hero_1',
      name: 'Hero Background Slider',
      images: JSON.stringify([
        '/sadsad.png',
        'https://picsum.photos/1920/1080?random=1',
        'https://picsum.photos/1920/1080?random=2'
      ]),
      auto_play: 1,
      interval: 8000,
      position: 0,
      is_visible: 1
    },
    {
      id: 'slider_promo_1',
      name: 'Promotional Slider',
      images: JSON.stringify([
        'https://picsum.photos/800/400?random=3',
        'https://picsum.photos/800/400?random=4',
        'https://picsum.photos/800/400?random=5'
      ]),
      auto_play: 1,
      interval: 5000,
      position: 1,
      is_visible: 1
    }
  ];

  defaultSliders.forEach(slider => {
    database.run(`
      INSERT OR IGNORE INTO landing_sliders (id, name, images, auto_play, interval, position, is_visible, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      slider.id,
      slider.name,
      slider.images,
      slider.auto_play,
      slider.interval,
      slider.position,
      slider.is_visible,
      now
    ]);
  });

  // Insert default site settings
  const defaultSiteSettings = [
    {
      id: 'setting_logo_url',
      setting_key: 'logo_url',
      setting_value: '/logo.svg',
      setting_type: 'string',
      description: 'Site logo URL'
    },
    {
      id: 'setting_message_of_the_day',
      setting_key: 'message_of_the_day',
      setting_value: 'Welcome to EquipGG.net!',
      setting_type: 'string',
      description: 'Message of the day'
    },
    {
      id: 'setting_betting_enabled',
      setting_key: 'betting_enabled',
      setting_value: 'true',
      setting_type: 'boolean',
      description: 'Enable betting features'
    },
    {
      id: 'setting_shop_enabled',
      setting_key: 'shop_enabled',
      setting_value: 'true',
      setting_type: 'boolean',
      description: 'Enable shop features'
    },
    {
      id: 'setting_arcade_enabled',
      setting_key: 'arcade_enabled',
      setting_value: 'true',
      setting_type: 'boolean',
      description: 'Enable arcade features'
    },
    {
      id: 'setting_forums_enabled',
      setting_key: 'forums_enabled',
      setting_value: 'true',
      setting_type: 'boolean',
      description: 'Enable forums features'
    },
    {
      id: 'setting_maintenance_mode',
      setting_key: 'maintenance_mode',
      setting_value: 'false',
      setting_type: 'boolean',
      description: 'Maintenance mode status'
    }
  ];

  defaultSiteSettings.forEach(setting => {
    database.run(`
      INSERT OR IGNORE INTO site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      setting.id,
      setting.setting_key,
      setting.setting_value,
      setting.setting_type,
      setting.description,
      now,
      now
    ]);
  });
  
  // Provably Fair System Tables
  database.run(`
    CREATE TABLE IF NOT EXISTS server_seeds (
      id TEXT PRIMARY KEY,
      seed TEXT NOT NULL,
      hashed_seed TEXT NOT NULL,
      is_revealed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      revealed_at TEXT
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS client_seeds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      seed TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  database.run(`
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
  `);

  // Indexes for performance
  database.run(`CREATE INDEX IF NOT EXISTS idx_server_seeds_revealed ON server_seeds (is_revealed);`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_client_seeds_user ON client_seeds (user_id);`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_game_results_user ON game_results (user_id);`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_game_results_game ON game_results (game_id);`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_game_results_type ON game_results (game_type);`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_game_results_created ON game_results (created_at);`);

  console.log('✅ Admin user ensured with role: admin');
  console.log('✅ Default landing page panels and sliders created');
  console.log('✅ Default site settings created');
  console.log('✅ Provably fair system tables created');
}

export function run(sql: string, params: (string | number | null)[] = []): void {
  if (!db) throw new Error('DB not loaded');
  
  // Simple mutex to prevent concurrent database operations
  while (dbMutex) {
    // Wait for mutex to be released
  }
  dbMutex = true;
  
  try {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
    persist();
  } finally {
    dbMutex = false;
  }
}

export function runAndGetId(sql: string, params: (string | number | null)[] = []): number {
  if (!db) throw new Error('DB not loaded');
  const stmt = db.prepare(sql);
  stmt.run(params);
  const insertId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
  stmt.free();
  persist();
  return insertId;
}

export function getOne<T = Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T | null {
  if (!db) throw new Error('DB not loaded');
  
  // Simple mutex to prevent concurrent database operations
  while (dbMutex) {
    // Wait for mutex to be released
  }
  dbMutex = true;
  
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row as T | null;
  } finally {
    dbMutex = false;
  }
}

export function getAll<T = Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T[] {
  if (!db) throw new Error('DB not loaded');
  
  // Simple mutex to prevent concurrent database operations
  while (dbMutex) {
    // Wait for mutex to be released
  }
  dbMutex = true;
  
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    stmt.free();
    return rows;
  } finally {
    dbMutex = false;
  }
}


