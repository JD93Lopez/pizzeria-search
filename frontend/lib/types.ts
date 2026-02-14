export interface Message {
  _id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: "pizza" | "bebida" | "postre" | "plato";
  size?: "individual" | "pequeña" | "mediana" | "grande" | "familiar";
  flavors?: string[];
  price: number;
  available: boolean;
  ingredients: string[];
  tags: string[];
  score?: number;
}

export interface AgentResponse {
  response: string;
  products: Product[];
  intent: {
    type: string;
    searchTerm: string;
    category?: string;
    size?: string;
    flavors?: string[];
  };
}

// Cart types
export interface CartItemFull {
  id: string;
  type: "full";
  product: Product;
  quantity: number;
}

export interface CartItemHalf {
  id: string;
  type: "half";
  firstHalf: Product;
  secondHalf?: Product; // undefined = waiting for the other half
  size: string;
  quantity: number;
}

export type CartItem = CartItemFull | CartItemHalf;

export interface OrderItem {
  type: "full" | "half";
  productIds: string[];
  size?: string;
  price: number;
  quantity: number;
}
