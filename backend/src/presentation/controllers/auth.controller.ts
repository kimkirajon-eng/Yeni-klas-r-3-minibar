import { Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';
import { LoginDTO } from '../../application/dto';

const authService = new AuthService(prisma);

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto: LoginDTO = req.body;
    if (!dto.username || !dto.password) {
      res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli' });
      return;
    }
    const result = await authService.login(dto);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
};
