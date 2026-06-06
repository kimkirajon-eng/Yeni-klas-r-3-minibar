import { Response, NextFunction } from 'express';
import { UserService } from '../../application/services/user.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const userService = new UserService(prisma);

export const getAllUsers = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) { next(err); }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getById(req.params.id);
    res.json(user);
  } catch (err) { next(err); }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
