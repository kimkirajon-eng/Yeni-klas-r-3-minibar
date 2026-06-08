import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { prisma } from './infrastructure/database/prisma/client';
import { wsService } from './infrastructure/websocket/websocket.service';
import { errorHandler } from './presentation/middleware/error-handler';
import { apiLimiter, authLimiter } from './presentation/middleware/rate-limiter';
import { requestLogger } from './infrastructure/logging/logger';
import { setupSwagger } from './presentation/swagger';

import authRoutes from './presentation/routes/auth.routes';
import blockRoutes from './presentation/routes/block.routes';
import floorRoutes from './presentation/routes/floor.routes';
import roomRoutes from './presentation/routes/room.routes';
import userRoutes from './presentation/routes/user.routes';
import productRoutes from './presentation/routes/product.routes';
import minibarRoutes from './presentation/routes/minibar.routes';
import reportRoutes from './presentation/routes/report.routes';
import shiftRoutes from './presentation/routes/shift.routes';
import backupRoutes from './presentation/routes/backup.routes';
import snapshotRoutes from './presentation/routes/snapshot.routes';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLogger);
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

setupSwagger(app);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/minibar', minibarRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/snapshots', snapshotRoutes);

/* Serve frontend build */
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use(errorHandler);

wsService.initialize(httpServer);

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[DB] Veritabanı bağlantısı başarılı');

    httpServer.listen(config.port, () => {
      console.log(`[Server] http://localhost:${config.port}`);
      console.log(`[Server] Ortam: ${config.nodeEnv}`);
      console.log(`[Server] Swagger: http://localhost:${config.port}/api/docs`);
    });
  } catch (error) {
    console.error('[DB] Bağlantı hatası:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();

export default app;
