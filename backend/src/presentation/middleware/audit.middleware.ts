import { Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma/client';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { logger } from '../../infrastructure/logging/logger';

export const auditLog = (action: string, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        prisma.roomStatusHistory.create({
          data: {
            roomId: req.body?.roomId || req.params?.id || 'unknown',
            oldStatus: action,
            newStatus: action,
            changedById: req.user.id,
            note: JSON.stringify({ method: req.method, path: req.originalUrl, entityType, body: req.body }),
          },
        }).catch((err) => logger.error('Audit log error', { err }));

        logger.info(`Audit: ${req.user.role} ${action} ${entityType}`, {
          userId: req.user.id,
          action,
          entityType,
          path: req.originalUrl,
        });
      }
      return originalJson(body);
    };
    next();
  };
};
