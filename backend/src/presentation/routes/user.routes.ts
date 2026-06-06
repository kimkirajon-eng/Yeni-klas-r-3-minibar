import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
