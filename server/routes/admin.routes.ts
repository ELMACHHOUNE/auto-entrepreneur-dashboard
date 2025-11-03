import { Router } from 'express';
import { verifyJwt, requireRole } from '../middleware/auth';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/admin.users.controller';

const router = Router();

router.use(verifyJwt, requireRole('admin'));

// Users management
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
