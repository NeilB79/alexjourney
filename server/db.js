import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = process.env.DATA_DIR || './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'alexjourney.db'));

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user', -- 'admin' or 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    start_date TEXT,
    end_date TEXT,
    is_ongoing INTEGER,
    settings_json TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    day_key TEXT, -- YYYY-MM-DD
    filename TEXT,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    smart_crop_json TEXT, -- {x, y, width, height}
    added_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    UNIQUE(project_id, day_key)
  );
`);

// Seed Admin User
const seedAdmin = () => {
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('neil');
  if (!admin) {
    const hash = bcrypt.hashSync('neil', 10);
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)');
    stmt.run('u_admin', 'neil', hash, 'admin');
    console.log('Admin user "neil" created.');
  }
};

seedAdmin();

export default db;