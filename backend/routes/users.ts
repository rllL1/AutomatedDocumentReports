import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/usersController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require admin access
router.use(authMiddleware, adminMiddleware);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
