import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';
import { ReportService } from '../../infrastructure/reporting/report.service';

const reportService = new ReportService(prisma);

export const downloadExcelReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockId = req.query.blockId as string | undefined;
    const floorId = req.query.floorId as string | undefined;
    await reportService.generateExcelReport(res, blockId, floorId);
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
};

export const downloadPDFReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockId = req.query.blockId as string | undefined;
    const floorId = req.query.floorId as string | undefined;
    await reportService.generatePDFReport(res, blockId, floorId);
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
};

export const getPerformanceStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await reportService.getPerformanceStats();
    res.json(stats);
  } catch (err) { next(err); }
};

export const getProductRevenue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.start as string | undefined;
    const endDate = req.query.end as string | undefined;
    const stats = await reportService.getProductRevenueReport(startDate, endDate);
    res.json(stats);
  } catch (err) { next(err); }
};

export const getRoomHeatmap = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockId = req.query.blockId as string | undefined;
    const floorId = req.query.floorId as string | undefined;
    const data = await reportService.getRoomConsumptionHeatmap(blockId, floorId);
    res.json(data);
  } catch (err) { next(err); }
};

export const getRoomConsumption = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.start as string | undefined;
    const endDate = req.query.end as string | undefined;
    const data = await reportService.getRoomConsumptionReport(startDate, endDate);
    res.json(data);
  } catch (err) { next(err); }
};

export const downloadRoomConsumptionPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.start as string | undefined;
    const endDate = req.query.end as string | undefined;
    await reportService.generateRoomConsumptionPDF(res, startDate, endDate);
  } catch (err) {
    if (res.headersSent) { res.end(); return; }
    next(err);
  }
};
