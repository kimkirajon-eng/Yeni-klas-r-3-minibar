import { Response, NextFunction } from 'express';
import { RoomService } from '../../application/services/room.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const roomService = new RoomService(prisma);

export const getAllRooms = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: { blockId?: string; floorId?: string } = {};
    if (req.query.blockId) filters.blockId = req.query.blockId as string;
    if (req.query.floorId) filters.floorId = req.query.floorId as string;
    const rooms = await roomService.getAll(filters);
    res.json(rooms);
  } catch (err) { next(err); }
};

export const getRoomById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const room = await roomService.getById(req.params.id);
    res.json(room);
  } catch (err) { next(err); }
};

export const createRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const room = await roomService.create(req.body);
    res.status(201).json(room);
  } catch (err) { next(err); }
};

export const updateRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const room = await roomService.update(req.params.id, req.body);
    res.json(room);
  } catch (err) { next(err); }
};

export const deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await roomService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

export const batchUpdateOccupancy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rooms = await roomService.batchUpdateOccupancy(req.body);
    res.json(rooms);
  } catch (err) { next(err); }
};

export const getRoomDetails = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const details = await roomService.getRoomDetails();
    res.json(details);
  } catch (err) { next(err); }
};

export const getRoomHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await roomService.getRoomHistory(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
};

export const getCostSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blockId = req.query.blockId as string | undefined;
    const floorId = req.query.floorId as string | undefined;
    const data = await roomService.getCostSummary(blockId, floorId);
    res.json(data);
  } catch (err) { next(err); }
};
