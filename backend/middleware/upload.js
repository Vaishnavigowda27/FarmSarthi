import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  fileFilter: fileFilter,
});

// Middleware: only parse multipart when Content-Type is multipart/form-data
export const optionalUpload = (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload.array('images', 5)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    req.files = [];
    next();
  }
};

// Export different upload configurations
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5); // Max 5 images
export const uploadFields = upload.fields([
  { name: 'equipmentPhotos', maxCount: 5 },
  { name: 'reviewPhotos', maxCount: 3 },
]);

export default upload;