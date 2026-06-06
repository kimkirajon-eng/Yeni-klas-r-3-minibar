import { Response, NextFunction } from 'express';
import { ShiftService } from '../../application/services/shift.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const shiftService = new ShiftService(prisma);

export const getAllShifts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shifts = await shiftService.getAll();
    res.json(shifts);
  } catch (err) { next(err); }
};

export const getShiftById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await shiftService.getById(req.params.id);
    res.json(shift);
  } catch (err) { next(err); }
};

export const getShiftsByDate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      const today = new Date().toISOString().split('T')[0];
      const shifts = await shiftService.getByDate(today);
      return res.json(shifts);
    }
    const shifts = await shiftService.getByDate(date as string);
    res.json(shifts);
  } catch (err) { next(err); }
};

export const createShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await shiftService.create(req.body);
    res.status(201).json(shift);
  } catch (err) { next(err); }
};

export const updateShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await shiftService.update(req.params.id, req.body);
    res.json(shift);
  } catch (err) { next(err); }
};

export const deleteShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shiftService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
