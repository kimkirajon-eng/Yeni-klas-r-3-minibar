import { Router } from 'express';
import * as minibarController from '../controllers/minibar.controller';
import { authenticate } from '../../infrastructure/auth/jwt.middleware';

const router = Router();

router.use(authenticate);

router.put('/status', minibarController.updateRoomStatus);
router.post('/consumption', minibarController.recordConsumption);
router.get('/history/:roomId', minibarController.getRoomHistory);
router.get('/today-logs', minibarController.getTodayLogs);
router.get('/dashboard', minibarController.getDashboardStats);
router.get('/status-histories', minibarController.getAllStatusHistories);
router.put('/:id/note', minibarController.updateRoomNote);

export default router;
