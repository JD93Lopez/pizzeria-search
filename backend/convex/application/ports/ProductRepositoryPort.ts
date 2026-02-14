import { Product } from "../../domain/models/Product";

export interface ProductRepositoryPort {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  create(product: Omit<Product, "id">): Promise<Product>;
  createMany(products: Omit<Product, "id">[]): Promise<string[]>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  findByCategory(category: string): Promise<Product[]>;
  getByIds(ids: string[]): Promise<Product[]>;
}
