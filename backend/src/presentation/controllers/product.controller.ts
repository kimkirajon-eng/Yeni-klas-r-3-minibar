import { Response, NextFunction } from 'express';
import { ProductService } from '../../application/services/product.service';
import { AuthRequest } from '../../infrastructure/auth/jwt.middleware';
import { prisma } from '../../infrastructure/database/prisma/client';

const productService = new ProductService(prisma);

export const getAllProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const products = await productService.getAll(includeInactive);
    res.json(products);
  } catch (err) { next(err); }
};

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (err) { next(err); }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (err) { next(err); }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await productService.delete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

export const updateStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const product = await productService.updateStock(req.params.id, quantity);
    res.json(product);
  } catch (err) { next(err); }
};

export const getLowStock = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await productService.getLowStock();
    res.json(products);
  } catch (err) { next(err); }
};

export const getStockSummary = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await productService.getStockSummary();
    res.json(summary);
  } catch (err) { next(err); }
};
