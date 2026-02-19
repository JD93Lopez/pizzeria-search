import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Application schema.
 *
 * Threads and messages are managed internally by @convex-dev/agent.
 * Embeddings are managed internally by @convex-dev/rag.
 */
export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("pizza"),
      v.literal("bebida"),
      v.literal("postre"),
      v.literal("plato")
    ),
    size: v.optional(
      v.union(
        v.literal("individual"),
        v.literal("pequeña"),
        v.literal("mediana"),
        v.literal("grande"),
        v.literal("familiar")
      )
    ),
    flavors: v.optional(v.array(v.string())),
    price: v.number(),
    available: v.boolean(),
    quantity: v.optional(v.number()),
    ingredients: v.array(v.string()),
    tags: v.array(v.string()),
    // Legacy field — kept for backward compatibility with existing data.
    // New embeddings are handled by the RAG component.
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_category", ["category"])
    .index("by_available", ["available"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["category", "available"],
    }),

  orders: defineTable({
    threadId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    items: v.array(
      v.object({
        type: v.union(v.literal("full"), v.literal("half")),
        productIds: v.array(v.id("products")),
        size: v.optional(v.string()),
        price: v.number(),
        quantity: v.number(),
      })
    ),
    total: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_status", ["status"]),
});
