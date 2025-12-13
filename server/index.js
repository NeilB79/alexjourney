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

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, color: user.role === 'admin' ? 'blue' : 'pink' } });
});

app.post('/api/users', authenticate, isAdmin, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({error: 'Missing fields'});
    
    try {
        const hash = bcrypt.hashSync(password, 10);
        const id = 'u_' + Date.now();
        db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, hash);
        res.json({ success: true, id });
    } catch (e) {
        res.status(400).json({ error: 'Username likely exists' });
    }
});

app.get('/api/users', authenticate, (req, res) => {
    // Return simple list for UI
    const users = db.prepare('SELECT id, username, role FROM users').all();
    const mapped = users.map(u => ({
        id: u.id,
        name: u.username,
        avatar: u.username[0].toUpperCase(),
        color: u.role === 'admin' ? 'blue' : 'pink'
    }));
    res.json(mapped);
});


// --- DATA ROUTES ---

// Get Project (Singleton for now per user, or shared)
app.get('/api/project', authenticate, (req, res) => {
    // For simplicity in this app, everyone shares the "Family Project"
    // In a real SaaS, this would be filtered by req.user.id
    let project = db.prepare('SELECT * FROM projects LIMIT 1').get();
    
    if (!project) {
        // Create default
        const id = 'p_default';
        db.prepare('INSERT INTO projects (id, user_id, name, start_date, end_date, is_ongoing, settings_json) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(id, req.user.id, 'Family Journey', '2024-01-01', '2024-12-31', 0, '{}');
        project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    }

    const photos = db.prepare('SELECT * FROM photos WHERE project_id = ?').all(project.id);
    const selections = {};
    
    photos.forEach(p => {
        selections[p.day_key] = {
            id: p.id,
            source: 'server',
            day: p.day_key,
            imageUrl: `/uploads/${p.filename}`,
            mimeType: p.mime_type,
            addedBy: p.added_by,
            smartCrop: p.smart_crop_json ? JSON.parse(p.smart_crop_json) : null
        };
    });

    res.json({
        id: project.id,
        name: project.name,
        startDate: project.start_date,
        endDate: project.end_date,
        isOngoing: !!project.is_ongoing,
        settings: JSON.parse(project.settings_json || '{}'),
        selections
    });
});

app.post('/api/project', authenticate, (req, res) => {
    const { id, name, startDate, endDate, isOngoing, settings } = req.body;
    db.prepare(`
        UPDATE projects 
        SET name = ?, start_date = ?, end_date = ?, is_ongoing = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(name, startDate, endDate, isOngoing ? 1 : 0, JSON.stringify(settings), id);
    res.json({ success: true });
});

// Upload Photo
app.post('/api/upload', authenticate, upload.single('photo'), async (req, res) => {
    const { projectId, dayKey } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        // 1. Analyze for Smart Crop (Face Focus)
        // Resize to a manageable size for analysis to speed it up
        const imageBuffer = await sharp(file.path).resize(1280).toBuffer();
        const cropResult = await smartcrop.crop(imageBuffer, { width: 1080, height: 1080 }); // Square preference for analysis
        const smartCropData = cropResult.topCrop;

        // 2. Check if existing photo exists for this day/project
        const existing = db.prepare('SELECT * FROM photos WHERE project_id = ? AND day_key = ?').get(projectId, dayKey);
        
        if (existing) {
            // Delete old file
            const oldPath = path.join(UPLOAD_DIR, existing.filename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            
            // Delete DB record
            db.prepare('DELETE FROM photos WHERE id = ?').run(existing.id);
        }

        // 3. Save new record
        const id = 'ph_' + Date.now();
        db.prepare(`
            INSERT INTO photos (id, project_id, day_key, filename, original_name, mime_type, size, smart_crop_json, added_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, projectId, dayKey, file.filename, file.originalname, file.mimetype, file.size, JSON.stringify(smartCropData), req.user.id);

        res.json({
            id,
            imageUrl: `/uploads/${file.filename}`,
            smartCrop: smartCropData
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
    
    // Fetch photos in range
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
        // Create input file list for ffmpeg
        // We will preprocess images using Sharp to apply the Smart Crop 
        // because doing complex crop filtering in a single ffmpeg command for variable inputs is extremely error prone.
        
        const fileListPath = path.join(tempDir, 'files.txt');
        const fileStream = fs.createWriteStream(fileListPath);
        
        // Target dimensions
        const [wStr, hStr] = (settings.aspectRatio === '9:16' ? '1080:1920' : settings.aspectRatio === '1:1' ? '1080:1080' : '1920:1080').split(':');
        const targetW = parseInt(wStr);
        const targetH = parseInt(hStr);

        console.log(`Starting render: ${photos.length} photos. Target: ${targetW}x${targetH}`);

        for (const [index, photo] of photos.entries()) {
            const originalPath = path.join(UPLOAD_DIR, photo.filename);
            const processedPath = path.join(tempDir, `frame_${index.toString().padStart(4, '0')}.jpg`);
            
            // Smart Crop Application
            const crop = photo.smart_crop_json ? JSON.parse(photo.smart_crop_json) : null;
            
            let pipeline = sharp(originalPath);
            
            // Logic: If settings.smartCrop is true and we have data, we assume the data is relative to the original image
            // Note: smartcrop library usually returns x, y, width, height for the crop area.
            
            if (settings.smartCrop && crop) {
               pipeline = pipeline.extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height });
            }
            
            // Resize to final output size (cover)
            await pipeline
                .resize(targetW, targetH, { fit: 'cover' })
                .toFile(processedPath);

            // Add to concat list
            // FFmpeg concat demuxer format:
            // file 'path'
            // duration 2
            fileStream.write(`file '${path.resolve(processedPath)}'\n`);
            fileStream.write(`duration ${settings.durationPerSlide}\n`);
        }
        
        // Add last file again due to FFmpeg concat quirk (it needs to know the duration of the last file)
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

            // Add Date Overlay if requested
            if (settings.showDateOverlay) {
                // Complex filter to add date text would go here. 
                // For MVP server rendering stability, we skip dynamic text burning via ffmpeg 
                // as it requires font config on the docker container.
                // We rely on the client-side canvas render for previews, this server render is for raw quality.
                // *Enhancement*: Could draw text using Sharp in the preprocessing step above.
            }

            command
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // Cleanup Temp
        fs.rmSync(tempDir, { recursive: true, force: true });

        res.json({ url: `/uploads/${outputFilename}` });

    } catch (e) {
        console.error("Render Error", e);
        // Cleanup Temp
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        res.status(500).json({ error: 'Rendering failed: ' + e.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});