import { Router } from 'express';
import * as shiftController from '../controllers/shift.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);

router.get('/', shiftController.getAllShifts);
router.get('/by-date', shiftController.getShiftsByDate);
router.get('/:id', shiftController.getShiftById);

router.post('/', authorize(UserRole.ADMIN), shiftController.createShift);
router.put('/:id', authorize(UserRole.ADMIN), shiftController.updateShift);
router.delete('/:id', authorize(UserRole.ADMIN), shiftController.deleteShift);

export default router;
