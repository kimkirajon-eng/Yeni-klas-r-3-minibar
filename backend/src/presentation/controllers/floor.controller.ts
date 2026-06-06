import { Response, NextFunction } from 'express';
import { FloorService } from '../../application/services/floor.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const floorService = new FloorService(prisma);

export const getFloorsByBlock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floors = await floorService.getByBlockId(req.params.blockId);
    res.json(floors);
  } catch (err) { next(err); }
};

export const getFloorById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floor = await floorService.getById(req.params.id);
    res.json(floor);
  } catch (err) { next(err); }
};

export const createFloor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floor = await floorService.create(req.body);
    res.status(201).json(floor);
  } catch (err) { next(err); }
};

export const updateFloor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floor = await floorService.update(req.params.id, req.body);
    res.json(floor);
  } catch (err) { next(err); }
};

export const deleteFloor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await floorService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
