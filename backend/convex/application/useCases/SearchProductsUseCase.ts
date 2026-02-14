import { SearchQuery } from "../../domain/models/SearchQuery";
import { Product } from "../../domain/models/Product";
import { SearchPort } from "../ports/SearchPort";

export async function searchProductsUseCase(
  searchPort: SearchPort,
  query: SearchQuery
): Promise<Product[]> {
  const results = await searchPort.search(query);
  return results;
}
