import { PrismaClient } from '@prisma/client';
import { CreateProductDTO, UpdateProductDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async getAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError('Ürün bulunamadı', 404);
    return product;
  }

  async create(dto: CreateProductDTO) {
    const existing = await this.prisma.product.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new AppError('Bu isimde bir ürün zaten var', 400);
    if (dto.price < 0) throw new AppError('Fiyat negatif olamaz', 400);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        stock: dto.stock ?? 0,
        minStockLevel: dto.minStockLevel ?? 5,
      },
    });
  }

  async update(id: string, dto: UpdateProductDTO) {
    await this.getById(id);
    if (dto.name) {
      const existing = await this.prisma.product.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new AppError('Bu isimde bir ürün zaten var', 400);
    }
    if (dto.price !== undefined && dto.price < 0) {
      throw new AppError('Fiyat negatif olamaz', 400);
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.getById(id);
    const newStock = product.stock + quantity;
    if (newStock < 0) throw new AppError('Yetersiz stok', 400);
    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  async getLowStock() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: this.prisma.product.fields.minStockLevel },
      },
      orderBy: { stock: 'asc' },
    });
  }

  async getStockSummary() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    const lowStock = products.filter((p) => p.stock <= p.minStockLevel);
    return {
      totalProducts: products.length,
      totalStock: products.reduce((s, p) => s + p.stock, 0),
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock,
      products,
    };
  }
}
