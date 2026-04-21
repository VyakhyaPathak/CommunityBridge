import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'community_bridge.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firebase_uid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'volunteer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Needs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS needs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      urgency_input INTEGER NOT NULL,
      urgency_score REAL,
      lat REAL,
      lng REAL,
      address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_analysis',
      submitted_by_email TEXT,
      ai_analysis_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )
  `);

  // Volunteers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      firebase_uid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      skill_tags TEXT NOT NULL DEFAULT '[]',
      location_address TEXT,
      lat REAL,
      lng REAL,
      radius_km INTEGER NOT NULL DEFAULT 10,
      is_available INTEGER NOT NULL DEFAULT 1,
      bio TEXT,
      total_tasks_completed INTEGER NOT NULL DEFAULT 0,
      total_hours REAL NOT NULL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      need_id TEXT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
      volunteer_id TEXT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      match_score REAL,
      ai_match_reason TEXT,
      coordinator_notes TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      completed_at DATETIME,
      hours_logged REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI Analyses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id TEXT PRIMARY KEY,
      need_id TEXT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
      model_used TEXT DEFAULT 'gemini-1.5-pro',
      prompt_tokens INTEGER,
      response_tokens INTEGER,
      raw_response TEXT,
      parsed_json TEXT,
      processing_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized successfully');
}

export default db;
export { uuidv4 };
