import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';
import { SnapshotService } from '../../application/services/snapshot.service';
import { ReportService } from '../../infrastructure/reporting/report.service';

const snapshotService = new SnapshotService(prisma);
const reportService = new ReportService(prisma);

export const createSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await snapshotService.createSnapshot(req.userId!);
    res.json(result);
  } catch (err) { next(err); }
};

export const listSnapshots = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshots = await snapshotService.listSnapshots();
    res.json(snapshots);
  } catch (err) { next(err); }
};

export const getSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshot = await snapshotService.getSnapshot(req.params.id);
    res.json(snapshot);
  } catch (err) { next(err); }
};

export const deleteSnapshot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await snapshotService.deleteSnapshot(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

export const downloadSnapshotPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const snapshot = await snapshotService.getSnapshot(req.params.id);
    await reportService.generateSnapshotPDF(res, snapshot);
  } catch (err) {
    if (res.headersSent) { res.end(); return; }
    next(err);
  }
};
