import express from 'express';
import multer from 'multer';
import {
  getAllDocuments,
  getDocumentById,
  uploadAndProcessDocument,
  deleteDocument,
  downloadDocument
} from '../controllers/documentsController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, TXT, and image files (JPG, PNG, GIF, BMP, TIFF) are allowed.'));
    }
  }
});

router.get('/', authMiddleware, getAllDocuments);
router.get('/:id', authMiddleware, getDocumentById);
router.get('/:id/download', authMiddleware, downloadDocument);
router.post('/', authMiddleware, adminMiddleware, upload.single('file'), uploadAndProcessDocument);
router.delete('/:id', authMiddleware, adminMiddleware, deleteDocument);

export default router;
