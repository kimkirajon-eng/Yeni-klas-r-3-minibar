import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logging/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { statusCode: err.statusCode, code: err.code });
    res.status(err.statusCode).json({
      message: err.message,
      status: 'error',
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn(`ValidationError: ${message}`);
    res.status(400).json({
      message,
      status: 'error',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message,
    status: 'error',
    code: 'INTERNAL_ERROR',
  });
};
