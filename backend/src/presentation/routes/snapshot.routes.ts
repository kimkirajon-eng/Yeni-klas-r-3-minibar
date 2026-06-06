import { Router } from 'express';
import * as snapshotController from '../controllers/snapshot.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/', snapshotController.createSnapshot);
router.get('/', snapshotController.listSnapshots);
router.get('/:id', snapshotController.getSnapshot);
router.delete('/:id', snapshotController.deleteSnapshot);
router.get('/:id/pdf', snapshotController.downloadSnapshotPDF);

export default router;
