import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';
import { BackupService } from '../../application/services/backup.service';

const backupService = new BackupService(prisma);

export const exportJson = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await backupService.exportAsJson(res);
  } catch (err) { next(err); }
};

export const exportSqlite = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await backupService.exportAsSqlite(res);
  } catch (err) { next(err); }
};
