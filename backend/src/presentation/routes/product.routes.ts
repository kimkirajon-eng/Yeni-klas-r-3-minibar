import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);

router.get('/', productController.getAllProducts);
router.get('/low-stock', productController.getLowStock);
router.get('/stock-summary', productController.getStockSummary);
router.get('/:id', productController.getProductById);

router.post('/', authorize(UserRole.ADMIN), productController.createProduct);
router.put('/:id', authorize(UserRole.ADMIN), productController.updateProduct);
router.put('/:id/stock', authorize(UserRole.ADMIN), productController.updateStock);
router.delete('/:id', authorize(UserRole.ADMIN), productController.deleteProduct);

export default router;
