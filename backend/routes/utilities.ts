import express from 'express';
import {
  getAllUtilities,
  getUtilityById,
  getUtilitiesByType,
  createUtility,
  updateUtility,
  deleteUtility
} from '../controllers/utilitiesController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getAllUtilities);
router.get('/single/:id', authMiddleware, getUtilityById);
router.get('/:type', authMiddleware, getUtilitiesByType);
router.post('/', authMiddleware, adminMiddleware, createUtility);
router.put('/:id', authMiddleware, adminMiddleware, updateUtility);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUtility);

export default router;
