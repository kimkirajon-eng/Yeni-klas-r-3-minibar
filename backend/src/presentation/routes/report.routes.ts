import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/excel', reportController.downloadExcelReport);
router.get('/pdf', reportController.downloadPDFReport);
router.get('/performance', reportController.getPerformanceStats);
router.get('/product-revenue', reportController.getProductRevenue);
router.get('/room-heatmap', reportController.getRoomHeatmap);
router.get('/room-consumption', reportController.getRoomConsumption);
router.get('/room-consumption/pdf', reportController.downloadRoomConsumptionPDF);

export default router;
