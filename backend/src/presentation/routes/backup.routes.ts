import { Router } from 'express';
import * as backupController from '../controllers/backup.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/json', backupController.exportJson);
router.get('/sqlite', backupController.exportSqlite);

export default router;
