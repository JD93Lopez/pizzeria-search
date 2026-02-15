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
  quantity: number;
  ingredients: string[];
  tags: string[];
  score?: number;
}

export interface AgentResponse {
  response: string;
}
