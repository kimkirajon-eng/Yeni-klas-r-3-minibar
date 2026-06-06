import { PrismaClient } from '@prisma/client';
import { ProductService } from '../../application/services/product.service';

describe('ProductService', () => {
  let prisma: PrismaClient;
  let service: ProductService;

  beforeAll(() => {
    prisma = new PrismaClient();
    service = new ProductService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should get all active products', async () => {
    const products = await service.getAll();
    expect(Array.isArray(products)).toBe(true);
    products.forEach((p) => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('price');
      expect(p).toHaveProperty('stock');
      expect(p).toHaveProperty('minStockLevel');
    });
  });

  it('should get product by id', async () => {
    const products = await service.getAll();
    if (products.length > 0) {
      const product = await service.getById(products[0].id);
      expect(product.id).toBe(products[0].id);
    }
  });

  it('should throw on non-existent product', async () => {
    await expect(service.getById('non-existent')).rejects.toThrow('Ürün bulunamadı');
  });

  it('should update stock', async () => {
    const products = await service.getAll();
    if (products.length > 0) {
      const product = await service.updateStock(products[0].id, 10);
      expect(product.stock).toBe(products[0].stock + 10);
    }
  });

  it('should reject negative stock', async () => {
    const products = await service.getAll();
    if (products.length > 0) {
      await expect(service.updateStock(products[0].id, -99999)).rejects.toThrow('Yetersiz stok');
    }
  });

  it('should get stock summary', async () => {
    const summary = await service.getStockSummary();
    expect(summary).toHaveProperty('totalProducts');
    expect(summary).toHaveProperty('totalStock');
    expect(summary).toHaveProperty('lowStockCount');
    expect(summary).toHaveProperty('lowStockProducts');
    expect(summary).toHaveProperty('products');
  });
});
