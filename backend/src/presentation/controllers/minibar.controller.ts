import { Response, NextFunction } from 'express';
import { MinibarService } from '../../application/services/minibar.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';
import { wsService } from '../../infrastructure/websocket/websocket.service';

const minibarService = new MinibarService(prisma, wsService);

export const updateRoomStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await minibarService.updateStatus(req.body, req.userId!);
    res.json(result);
  } catch (err) { next(err); }
};

export const recordConsumption = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await minibarService.recordConsumption(req.body, req.userId!);
    res.json(result);
  } catch (err) { next(err); }
};

export const getRoomHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const history = await minibarService.getRoomHistory(req.params.roomId);
    res.json(history);
  } catch (err) { next(err); }
};

export const getTodayLogs = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await minibarService.getTodayLogs();
    res.json(logs);
  } catch (err) { next(err); }
};

export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await minibarService.getDashboardStats();
    res.json(stats);
  } catch (err) { next(err); }
};

export const getAllStatusHistories = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const histories = await minibarService.getAllStatusHistories();
    res.json(histories);
  } catch (err) { next(err); }
};

export const updateRoomNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const room = await minibarService.updateRoomNote(req.params.id, req.body.note, req.userId!);
    res.json(room);
  } catch (err) { next(err); }
};
