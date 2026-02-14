import { Product } from "../../domain/models/Product";
import { ProductRepositoryPort } from "../ports/ProductRepositoryPort";

export async function createProductUseCase(
  repository: ProductRepositoryPort,
  product: Omit<Product, "id">
): Promise<Product> {
  return repository.create(product);
}

export async function createManyProductsUseCase(
  repository: ProductRepositoryPort,
  products: Omit<Product, "id">[]
): Promise<string[]> {
  return repository.createMany(products);
}
