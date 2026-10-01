// Multer memory storage — buffers are streamed straight to Cloudinary.
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  }
});

// Image OR video (used for WhatsApp template media headers).
export const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB
  fileFilter: (_req, file, cb) => {
    if (/^(image|video)\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image or video uploads are allowed'));
  }
});

export default upload;
