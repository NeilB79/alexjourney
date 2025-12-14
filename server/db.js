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

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    start_date TEXT,
    end_date TEXT,
    is_ongoing INTEGER DEFAULT 0,
    theme_pref TEXT DEFAULT 'dark',
    video_settings_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    day_key TEXT, -- YYYY-MM-DD
    filename TEXT,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    smart_crop_json TEXT, -- {x, y, width, height} stored from analysis
    added_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(added_by) REFERENCES users(id),
    UNIQUE(project_id, day_key)
  );
`);

// Seed Admin User
const seedAdmin = () => {
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('neil');
  if (!admin) {
    const hash = bcrypt.hashSync('neil', 10);
    const id = 'u_admin';
    db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(id, 'neil', hash, 'admin');
    
    // Default Settings for Admin
    db.prepare(`
      INSERT OR IGNORE INTO user_settings (user_id, start_date, end_date, is_ongoing) 
      VALUES (?, ?, ?, ?)
    `).run(id, '2025-01-01', '2025-12-31', 0);
    
    console.log('Admin user "neil" created.');
  }

  // Seed Default Project
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('p_default');
  if (!project) {
    db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run('p_default', 'Family Memories');
  }
};

seedAdmin();

export default db;