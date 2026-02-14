export interface Product {
  id: string;
  name: string;
  description: string;
  category: "pizza" | "bebida" | "postre" | "combo";
  size?: "pequeña" | "mediana" | "grande" | "familiar";
  flavors?: string[];
  price: number;
  available: boolean;
  ingredients: string[];
  tags: string[];
  vectorEmbedding?: number[];
}

export interface ProductVariant {
  productId: string;
  variantName: string;
  size: string;
  flavors: string[];
  price: number;
}
