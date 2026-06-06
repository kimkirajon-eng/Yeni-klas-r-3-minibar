import winston from 'winston';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format,
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 10 * 1024 * 1024, maxFiles: 10 }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${extra}`;
      })
    ),
  }));
}

export const requestLogger = (req: any, _res: any, next: any) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: (req as any).user?.id,
    userAgent: req.headers['user-agent'],
  });
  next();
};

export default logger;
