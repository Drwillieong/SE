import express from 'express';
import { uploadSingleFile, multerUpload } from '../controllers/uploadController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for single file upload, protected by authentication
// The multerUpload.single('photo') middleware processes the file from the 'photo' field
router.post('/', verifyToken, requireAdmin, multerUpload.single('photo'), uploadSingleFile);

export default router;