import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Şifre gerekli'),
});

export const createBlockSchema = z.object({
  name: z.string().min(1, 'Blok adı gerekli').max(100),
});

export const createFloorSchema = z.object({
  name: z.string().min(1, 'Kat adı gerekli').max(100),
  blockId: z.string().uuid('Geçersiz blok ID'),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Oda adı gerekli').max(50),
  floorId: z.string().uuid('Geçersiz kat ID'),
  blockId: z.string().uuid('Geçersiz blok ID'),
});

export const updateRoomStatusSchema = z.object({
  roomId: z.string().uuid('Geçersiz oda ID'),
  status: z.enum(['DND', 'LATER', 'COMPLETED', 'PENDING']),
  note: z.string().optional(),
});

export const consumptionSchema = z.object({
  roomId: z.string().uuid('Geçersiz oda ID'),
  items: z.array(z.object({
    productId: z.string().uuid('Geçersiz ürün ID'),
    quantity: z.number().int().positive('Miktar pozitif olmalı'),
  })),
  note: z.string().optional(),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'Ad gerekli'),
  lastName: z.string().min(1, 'Soyad gerekli'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter'),
  password: z.string().min(6, 'Şifre en az 6 karakter'),
  role: z.enum(['ADMIN', 'PERSONNEL']),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli'),
  price: z.number().positive('Fiyat pozitif olmalı'),
  stock: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int('Miktar tam sayı olmalı'),
});

export const batchOccupancySchema = z.object({
  roomIds: z.array(z.string().uuid()).min(1, 'En az bir oda seçilmeli'),
  occupancyStatus: z.enum(['VACANT', 'INHOUSE', 'ARRIVAL', 'DEPARTURE', 'DEPARTURE_ARRIVAL']),
});

export const createShiftSchema = z.object({
  userId: z.string().uuid('Geçersiz kullanıcı ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Geçersiz saat formatı (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Geçersiz saat formatı (HH:MM)'),
  note: z.string().optional(),
});

export const updateNoteSchema = z.object({
  note: z.string().nullable(),
});
