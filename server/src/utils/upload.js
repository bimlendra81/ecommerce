import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

function fileFilter(req, file, cb) {
  if (IMAGE_MIME.includes(file.mimetype) || VIDEO_MIME.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Only image and video files are allowed'));
}

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});
