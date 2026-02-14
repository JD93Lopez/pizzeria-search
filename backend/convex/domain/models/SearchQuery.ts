export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    size?: string;
    maxPrice?: number;
    minPrice?: number;
    available?: boolean;
  };
  limit?: number;
  includeSimilar?: boolean;
}
