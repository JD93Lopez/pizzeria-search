import { SearchQuery } from "../models/SearchQuery";
import { Product } from "../models/Product";
import { SearchPort } from "../../application/ports/SearchPort";

export class SearchService {
  constructor(private readonly searchPort: SearchPort) {}

  async search(query: SearchQuery): Promise<Product[]> {
    return this.searchPort.search(query);
  }
}
