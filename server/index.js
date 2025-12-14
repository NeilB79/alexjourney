import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import db from './db.js';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import ffmpeg from 'fluent-ffmpeg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

// Ensure upload directory
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

// Static files for uploaded images
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware: Authenticate Token
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    next();
};

// --- AUTH ROUTES ---

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Get user settings
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);
  
  // Create default settings if not exist
  if (!settings) {
      const year = new Date().getFullYear();
      db.prepare('INSERT INTO user_settings (user_id, start_date, end_date, is_ongoing) VALUES (?, ?, ?, ?)').run(user.id, `${year}-01-01`, `${year}-12-31`, 0);
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ 
      token, 
      user: { 
          id: user.id, 
          name: user.username, 
          role: user.role, 
          avatar: user.username[0].toUpperCase(),
          color: user.role === 'admin' ? 'blue' : 'pink'
      },
      settings: {
          startDate: settings.start_date,
          endDate: settings.end_date,
          isOngoing: !!settings.is_ongoing,
          themePref: settings.theme_pref,
          videoSettings: settings.video_settings_json ? JSON.parse(settings.video_settings_json) : null
      }
  });
});

app.post('/api/users', authenticate, isAdmin, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({error: 'Missing fields'});
    
    try {
        const hash = bcrypt.hashSync(password, 10);
        const id = 'u_' + Date.now();
        db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, hash);
        
        // Default settings
        const year = new Date().getFullYear();
        db.prepare('INSERT INTO user_settings (user_id, start_date, end_date) VALUES (?, ?, ?)').run(id, `${year}-01-01`, `${year}-12-31`);

        res.json({ success: true, id });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: 'Username likely exists' });
    }
});

app.put('/api/users/:id', authenticate, isAdmin, (req, res) => {
    const { username, password } = req.body;
    const { id } = req.params;
    
    try {
        if (password && password.trim().length > 0) {
             const hash = bcrypt.hashSync(password, 10);
             db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(username, hash, id);
        } else {
             db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(400).json({ error: 'Update failed (username might exist)' });
    }
});

app.get('/api/users', authenticate, (req, res) => {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    const mapped = users.map(u => ({
        id: u.id,
        name: u.username,
        role: u.role,
        avatar: u.username[0].toUpperCase(),
        color: u.role === 'admin' ? 'blue' : 'pink'
    }));
    res.json(mapped);
});


// --- DATA ROUTES ---

app.get('/api/project', authenticate, (req, res) => {
    // Shared Project
    let project = db.prepare('SELECT * FROM projects WHERE id = ?').get('p_default');
    
    // User specific settings
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);

    const photos = db.prepare(`
        SELECT p.*, u.username as added_by_name 
        FROM photos p 
        LEFT JOIN users u ON p.added_by = u.id
        WHERE project_id = ?
    `).all('p_default');
    
    const selections = {};
    photos.forEach(p => {
        selections[p.day_key] = {
            id: p.id,
            source: 'server',
            day: p.day_key,
            imageUrl: `/uploads/${p.filename}`,
            mimeType: p.mime_type,
            addedBy: p.added_by,
            addedByName: p.added_by_name,
            createdAt: p.created_at,
            smartCrop: p.smart_crop_json ? JSON.parse(p.smart_crop_json) : null
        };
    });

    res.json({
        id: project.id,
        name: project.name,
        // Return user specific dates/settings
        startDate: settings.start_date,
        endDate: settings.end_date,
        isOngoing: !!settings.is_ongoing,
        settings: settings.video_settings_json ? JSON.parse(settings.video_settings_json) : null,
        selections
    });
});

app.post('/api/project/settings', authenticate, (req, res) => {
    const { startDate, endDate, isOngoing, settings } = req.body;
    db.prepare(`
        UPDATE user_settings 
        SET start_date = ?, end_date = ?, is_ongoing = ?, video_settings_json = ?
        WHERE user_id = ?
    `).run(startDate, endDate, isOngoing ? 1 : 0, JSON.stringify(settings), req.user.id);
    res.json({ success: true });
});

app.post('/api/project/name', authenticate, isAdmin, (req, res) => {
    const { name } = req.body;
    db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, 'p_default');
    res.json({ success: true });
});

// Upload Photo
app.post('/api/upload', authenticate, upload.single('photo'), async (req, res) => {
    const { projectId, dayKey } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        // 1. Analyze for Smart Crop (Face Focus)
        let smartCropData = null;
        try {
            const imageBuffer = await sharp(file.path).resize(1280).toBuffer();
            const cropResult = await smartcrop.crop(imageBuffer, { width: 1080, height: 1080 });
            smartCropData = cropResult.topCrop;
        } catch (e) {
            console.warn("Smart crop failed, defaulting center", e);
        }

        // 2. Check/Delete Existing
        const existing = db.prepare('SELECT * FROM photos WHERE project_id = ? AND day_key = ?').get(projectId, dayKey);
        
        if (existing) {
            const oldPath = path.join(UPLOAD_DIR, existing.filename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            db.prepare('DELETE FROM photos WHERE id = ?').run(existing.id);
        }

        // 3. Save
        const id = 'ph_' + Date.now();
        db.prepare(`
            INSERT INTO photos (id, project_id, day_key, filename, original_name, mime_type, size, smart_crop_json, added_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, projectId, dayKey, file.filename, file.originalname, file.mimetype, file.size, JSON.stringify(smartCropData), req.user.id);

        res.json({
            id,
            imageUrl: `/uploads/${file.filename}`,
            smartCrop: smartCropData,
            addedBy: req.user.id,
            addedByName: req.user.username,
            createdAt: new Date().toISOString()
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Processing failed' });
    }
});

app.delete('/api/photo/:id', authenticate, (req, res) => {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (photo) {
        const filePath = path.join(UPLOAD_DIR, photo.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
});


// --- SERVER SIDE RENDERING ---

app.post('/api/render', authenticate, async (req, res) => {
    const { projectId, rangeStart, rangeEnd, settings } = req.body;
    
    const photos = db.prepare(`
        SELECT * FROM photos 
        WHERE project_id = ? AND day_key >= ? AND day_key <= ?
        ORDER BY day_key ASC
    `).all(projectId, rangeStart, rangeEnd);

    if (photos.length === 0) return res.status(400).json({ error: 'No photos in range' });

    const outputFilename = `render_${Date.now()}.mp4`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);
    const tempDir = path.join(UPLOAD_DIR, 'temp_' + Date.now());

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
        const fileListPath = path.join(tempDir, 'files.txt');
        const fileStream = fs.createWriteStream(fileListPath);
        
        // Target dimensions
        const [wStr, hStr] = (settings.aspectRatio === '9:16' ? '1080:1920' : settings.aspectRatio === '1:1' ? '1080:1080' : '1920:1080').split(':');
        const targetW = parseInt(wStr);
        const targetH = parseInt(hStr);

        console.log(`Starting render: ${photos.length} photos. Target: ${targetW}x${targetH}. SmartCrop: ${settings.smartCrop}`);

        for (const [index, photo] of photos.entries()) {
            const originalPath = path.join(UPLOAD_DIR, photo.filename);
            const processedPath = path.join(tempDir, `frame_${index.toString().padStart(4, '0')}.jpg`);
            
            const crop = photo.smart_crop_json ? JSON.parse(photo.smart_crop_json) : null;
            let pipeline = sharp(originalPath);
            
            if (settings.smartCrop && crop) {
               pipeline = pipeline.resize(targetW, targetH, { fit: 'cover', position: 'attention' });
            } else {
               pipeline = pipeline.resize(targetW, targetH, { fit: 'cover' });
            }
            
            await pipeline.toFile(processedPath);

            fileStream.write(`file '${path.resolve(processedPath)}'\n`);
            fileStream.write(`duration ${settings.durationPerSlide}\n`);
        }
        
        // Fix for ffmpeg concat last frame duration
        const lastIndex = photos.length - 1;
        fileStream.write(`file '${path.resolve(path.join(tempDir, `frame_${lastIndex.toString().padStart(4, '0')}.jpg`))}'\n`);
        
        fileStream.end();

        await new Promise((resolve, reject) => {
            const command = ffmpeg()
                .input(fileListPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-r 30'
                ]);

            command
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
        res.json({ url: `/uploads/${outputFilename}` });

    } catch (e) {
        console.error("Render Error", e);
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        res.status(500).json({ error: 'Rendering failed: ' + e.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});