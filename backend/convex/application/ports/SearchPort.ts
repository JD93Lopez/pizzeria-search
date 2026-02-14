import { SearchQuery } from "../../domain/models/SearchQuery";
import { Product } from "../../domain/models/Product";

export interface SearchPort {
  search(query: SearchQuery): Promise<Product[]>;
}
