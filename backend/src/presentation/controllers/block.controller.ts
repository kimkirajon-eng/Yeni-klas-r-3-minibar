import { Response, NextFunction } from 'express';
import { BlockService } from '../../application/services/block.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const blockService = new BlockService(prisma);

export const getAllBlocks = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blocks = await blockService.getAll();
    res.json(blocks);
  } catch (err) { next(err); }
};

export const getBlockById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const block = await blockService.getById(req.params.id);
    res.json(block);
  } catch (err) { next(err); }
};

export const createBlock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const block = await blockService.create(req.body);
    res.status(201).json(block);
  } catch (err) { next(err); }
};

export const updateBlock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const block = await blockService.update(req.params.id, req.body);
    res.json(block);
  } catch (err) { next(err); }
};

export const deleteBlock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await blockService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
