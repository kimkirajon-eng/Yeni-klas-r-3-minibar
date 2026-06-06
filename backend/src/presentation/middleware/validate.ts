import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error-handler';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new AppError(message, 400));
      } else {
        next(err);
      }
    }
  };
};
