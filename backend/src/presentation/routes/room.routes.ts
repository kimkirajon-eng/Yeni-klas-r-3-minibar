import { Router } from 'express';
import * as roomController from '../controllers/room.controller';
import { authenticate } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';
import { authorize } from '../../infrastructure/auth/jwt.middleware';

const router = Router();

router.use(authenticate);

router.get('/', roomController.getAllRooms);
router.get('/details', roomController.getRoomDetails);
router.get('/cost-summary', roomController.getCostSummary);
router.get('/:id', roomController.getRoomById);
router.get('/:id/history', roomController.getRoomHistory);

router.post('/batch-occupancy', authorize(UserRole.ADMIN), roomController.batchUpdateOccupancy);
router.post('/', authorize(UserRole.ADMIN), roomController.createRoom);
router.put('/:id', authorize(UserRole.ADMIN), roomController.updateRoom);
router.delete('/:id', authorize(UserRole.ADMIN), roomController.deleteRoom);

export default router;
