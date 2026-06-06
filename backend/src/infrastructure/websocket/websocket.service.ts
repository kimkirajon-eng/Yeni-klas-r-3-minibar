import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../../config';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketService {
  private io: Server | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token as string, config.jwt.secret) as any;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[WS] Kullanıcı bağlandı: ${socket.userId} (${socket.userRole})`);

      if (socket.userRole === 'ADMIN') {
        socket.join('admin-room');
      }
      socket.join('personnel-room');

      socket.on('disconnect', () => {
        console.log(`[WS] Kullanıcı ayrıldı: ${socket.userId}`);
      });
    });

    console.log('[WS] WebSocket sunucusu başlatıldı');
  }

  broadcast(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  broadcastToAdmins(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to('admin-room').emit(event, data);
  }

  broadcastToPersonnel(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to('personnel-room').emit(event, data);
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const wsService = new WebSocketService();
