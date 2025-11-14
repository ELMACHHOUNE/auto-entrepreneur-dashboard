import { Router } from 'express';
import { verifyJwt } from '../middleware/auth';
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoice.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

// Tighter limits for write operations to mitigate DoS surfaces on file system operations
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyJwt);
router.get('/', listInvoices); // GET /api/invoices?year=2025
router.post('/', writeLimiter, createInvoice);
router.patch('/:id', writeLimiter, updateInvoice);
router.delete('/:id', writeLimiter, deleteInvoice);

export default router;
