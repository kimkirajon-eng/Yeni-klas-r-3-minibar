import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UserRole } from '../../domain/enums';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ message: 'Yetkilendirme gerekli' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: UserRole };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      return;
    }
    next();
  };
};
