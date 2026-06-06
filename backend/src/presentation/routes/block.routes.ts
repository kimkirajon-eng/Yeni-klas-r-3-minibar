import { Router } from 'express';
import * as blockController from '../controllers/block.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);

router.get('/', blockController.getAllBlocks);
router.get('/:id', blockController.getBlockById);

router.post('/', authorize(UserRole.ADMIN), blockController.createBlock);
router.put('/:id', authorize(UserRole.ADMIN), blockController.updateBlock);
router.delete('/:id', authorize(UserRole.ADMIN), blockController.deleteBlock);

export default router;
