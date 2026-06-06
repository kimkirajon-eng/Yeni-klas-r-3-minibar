import { authenticate, authorize } from '../../infrastructure/auth/jwt.middleware';
import { UserRole } from '../../domain/enums';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  const mockToken = jwt.sign(
    { id: 'test-user', role: UserRole.ADMIN },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  it('should generate valid JWT token', () => {
    expect(mockToken).toBeTruthy();
    const decoded = jwt.verify(mockToken, process.env.JWT_SECRET || 'fallback-secret') as any;
    expect(decoded.id).toBe('test-user');
    expect(decoded.role).toBe(UserRole.ADMIN);
  });

  it('should reject invalid token', () => {
    expect(() => jwt.verify('invalid-token', 'secret')).toThrow();
  });

  it('should have authenticate function', () => {
    expect(typeof authenticate).toBe('function');
  });

  it('should have authorize function', () => {
    const middleware = authorize(UserRole.ADMIN);
    expect(typeof middleware).toBe('function');
  });

  it('should reject non-admin role', () => {
    const middleware = authorize(UserRole.ADMIN);
    const req = { user: { role: UserRole.PERSONNEL } } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
