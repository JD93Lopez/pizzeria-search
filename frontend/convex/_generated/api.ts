// Re-export from backend for convenience
// This file is a placeholder that will be replaced by Convex codegen
// when you run `npx convex dev` in the frontend directory

// For now, we'll create a simplified version that works with the monorepo setup
// In production, you should run Convex from the frontend directory

export const api = {
  agents: {
    pizzaAgent: {
      createThread: "agents/pizzaAgent:createThread",
      getMessages: "agents/pizzaAgent:getMessages",
      saveMessage: "agents/pizzaAgent:saveMessage",
      processChatMessage: "agents/pizzaAgent:processChatMessage",
    },
  },
  products: {
    list: "products:list",
    getById: "products:getById",
    getByIds: "products:getByIds",
    create: "products:create",
    createMany: "products:createMany",
    update: "products:update",
    remove: "products:remove",
    clearAll: "products:clearAll",
    setAllQuantities: "products:setAllQuantities",
  },
  orders: {
    create: "orders:create",
    confirm: "orders:confirm",
    cancel: "orders:cancel",
    getById: "orders:getById",
    getByThread: "orders:getByThread",
  },
  rag: {
    vectorSearch: {
      searchByEmbedding: "rag/vectorSearch:searchByEmbedding",
    },
    productIndexer: {
      indexProductPublic: "rag/productIndexer:indexProductPublic",
    },
  },
} as any;
