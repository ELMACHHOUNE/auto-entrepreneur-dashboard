import { Router } from 'express';
import { verifyJwt, requireRole } from '../middleware/auth';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  usersStatsYearly,
  usersStatsByCategory,
  usersCount,
} from '../controllers/admin.users.controller';

const router = Router();

router.use(verifyJwt, requireRole('admin'));

// Users management
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Users stats
router.get('/users/stats/yearly', usersStatsYearly);
router.get('/users/stats/by-category', usersStatsByCategory);
router.get('/users/stats/count', usersCount);

export default router;
