import { Router } from 'express';
import * as floorController from '../controllers/floor.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);

router.get('/block/:blockId', floorController.getFloorsByBlock);
router.get('/:id', floorController.getFloorById);

router.post('/', authorize(UserRole.ADMIN), floorController.createFloor);
router.put('/:id', authorize(UserRole.ADMIN), floorController.updateFloor);
router.delete('/:id', authorize(UserRole.ADMIN), floorController.deleteFloor);

export default router;
