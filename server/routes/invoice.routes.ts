import { Router } from 'express';
import { verifyJwt } from '../middleware/auth';
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../controllers/invoice.controller';

const router = Router();

router.use(verifyJwt);
router.get('/', listInvoices); // GET /api/invoices?year=2025
router.post('/', createInvoice);
router.patch('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
