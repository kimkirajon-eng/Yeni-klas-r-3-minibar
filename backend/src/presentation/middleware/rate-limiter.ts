import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla istek gönderildi. Lütfen kısa süre bekleyin.', status: 'error', code: 'RATE_LIMIT' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.', status: 'error', code: 'AUTH_RATE_LIMIT' },
});
