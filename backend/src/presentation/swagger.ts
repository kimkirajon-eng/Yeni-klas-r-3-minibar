import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Minibar Yönetim Sistemi API',
      version: '1.0.0',
      description: 'Enterprise hotel minibar management system with real-time updates, RBAC, and reporting.',
      contact: { name: 'Development Team' },
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: '/api', description: 'Production (via proxy)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { message: { type: 'string' }, status: { type: 'string' } },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            occupancyStatus: { type: 'string', enum: ['VACANT', 'INHOUSE', 'ARRIVAL', 'DEPARTURE', 'DEPARTURE_ARRIVAL'] },
            minibarStatus: { type: 'string', enum: ['PENDING', 'COMPLETED', 'DND', 'LATER'] },
            note: { type: 'string', nullable: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            minStockLevel: { type: 'integer' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: { username: { type: 'string' }, password: { type: 'string', format: 'password' } },
        },
        LoginResponse: {
          type: 'object',
          properties: { token: { type: 'string' }, user: { type: 'object' } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Kullanıcı girişi',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: { '200': { description: 'Başarılı giriş', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } }, '401': { description: 'Geçersiz kimlik bilgileri' } },
        },
      },
      '/api/auth/me': {
        get: { tags: ['Auth'], summary: 'Kullanıcı bilgisi', responses: { '200': { description: 'Kullanıcı bilgisi' } } },
      },
      '/api/rooms': {
        get: { tags: ['Rooms'], summary: 'Tüm odaları listele', parameters: [{ name: 'blockId', in: 'query', schema: { type: 'string' } }, { name: 'floorId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Oda listesi' } } },
        post: { tags: ['Rooms'], summary: 'Yeni oda oluştur', responses: { '201': { description: 'Oda oluşturuldu' } } },
      },
      '/api/rooms/{id}': {
        get: { tags: ['Rooms'], summary: 'Oda detayı', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Oda detayı' } } },
        put: { tags: ['Rooms'], summary: 'Oda güncelle', responses: { '200': { description: 'Güncellendi' } } },
        delete: { tags: ['Rooms'], summary: 'Oda sil', responses: { '204': { description: 'Silindi' } } },
      },
      '/api/rooms/cost-summary': {
        get: { tags: ['Rooms'], summary: 'Maliyet özeti', responses: { '200': { description: 'Maliyet verileri' } } },
      },
      '/api/rooms/{id}/history': {
        get: { tags: ['Rooms'], summary: 'Oda geçmişi', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Oda aktivite geçmişi' } } },
      },
      '/api/products': {
        get: { tags: ['Products'], summary: 'Ürün listesi', responses: { '200': { description: 'Ürün listesi' } } },
        post: { tags: ['Products'], summary: 'Ürün ekle', responses: { '201': { description: 'Ürün oluşturuldu' } } },
      },
      '/api/products/stock-summary': {
        get: { tags: ['Products'], summary: 'Stok özeti', responses: { '200': { description: 'Stok durumu' } } },
      },
      '/api/products/low-stock': {
        get: { tags: ['Products'], summary: 'Düşük stoklu ürünler', responses: { '200': { description: 'Düşük stok listesi' } } },
      },
      '/api/products/{id}/stock': {
        put: { tags: ['Products'], summary: 'Stok güncelle', responses: { '200': { description: 'Stok güncellendi' } } },
      },
      '/api/minibar/status': {
        put: { tags: ['Minibar'], summary: 'Minibar durumu güncelle', responses: { '200': { description: 'Durum güncellendi' } } },
      },
      '/api/minibar/consumption': {
        post: { tags: ['Minibar'], summary: 'Tüketim kaydet', responses: { '200': { description: 'Tüketim kaydedildi' } } },
      },
      '/api/minibar/dashboard': {
        get: { tags: ['Minibar'], summary: 'Dashboard istatistikleri', responses: { '200': { description: 'İstatistikler' } } },
      },
      '/api/reports/excel': {
        get: { tags: ['Reports'], summary: 'Excel raporu indir', responses: { '200': { description: 'Excel dosyası' } } },
      },
      '/api/reports/pdf': {
        get: { tags: ['Reports'], summary: 'PDF raporu indir', responses: { '200': { description: 'PDF dosyası' } } },
      },
      '/api/reports/performance': {
        get: { tags: ['Reports'], summary: 'Performans raporu', responses: { '200': { description: 'Personel performansı' } } },
      },
      '/api/shifts': {
        get: { tags: ['Shifts'], summary: 'Vardiya listesi', responses: { '200': { description: 'Vardiyalar' } } },
        post: { tags: ['Shifts'], summary: 'Vardiya ekle', responses: { '201': { description: 'Vardiya oluşturuldu' } } },
      },
      '/api/backup/json': {
        get: { tags: ['Backup'], summary: 'JSON yedek indir', responses: { '200': { description: 'JSON dosyası' } } },
      },
      '/api/backup/sqlite': {
        get: { tags: ['Backup'], summary: 'SQLite yedek indir', responses: { '200': { description: 'SQLite dosyası' } } },
      },
      '/api/blocks': {
        get: { tags: ['Blocks'], summary: 'Blok listesi', responses: { '200': { description: 'Bloklar' } } },
      },
      '/api/users': {
        get: { tags: ['Users'], summary: 'Kullanıcı listesi', responses: { '200': { description: 'Kullanıcılar' } } },
      },
    },
  },
  apis: [],
};

export const setupSwagger = (app: Application): void => {
  const spec = swaggerJsdoc(options);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css' }));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
  console.log('[Swagger] API docs at /api/docs');
};
