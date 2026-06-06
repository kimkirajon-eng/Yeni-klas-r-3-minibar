import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => socket.on(event, handler));
      });
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Bağlantı hatası:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Bağlantı kesildi');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler as Function);

    socketRef.current?.on(event, handler);

    return () => {
      listenersRef.current.get(event)?.delete(handler as Function);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback(<T>(event: string, data: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { on, emit, socket: socketRef.current };
};
