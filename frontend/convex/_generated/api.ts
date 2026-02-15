// Manual API map — mirrors the Convex backend module structure.
// Must be kept in sync when backend files are added/renamed.

export const api = {
  agents: {
    chatOrchestrator: {
      processChatMessage: "agents/chatOrchestrator:processChatMessage",
    },
    messageService: {
      saveMessage: "agents/messageService:saveMessage",
      getMessages: "agents/messageService:getMessages",
    },
    threadService: {
      createThread: "agents/threadService:createThread",
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
