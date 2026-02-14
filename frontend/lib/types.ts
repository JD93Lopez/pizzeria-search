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
  category: "pizza" | "bebida" | "postre" | "combo";
  size?: "pequeña" | "mediana" | "grande" | "familiar";
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
