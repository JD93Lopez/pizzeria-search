import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    ingredients: v.array(v.string()),
    tags: v.array(v.string()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_category", ["category"])
    .index("by_available", ["available"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["category", "available"],
    }),

  messages: defineTable({
    threadId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "createdAt"]),

  threads: defineTable({
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Orders table
  orders: defineTable({
    threadId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    items: v.array(
      v.object({
        // "full" = pizza completa, "half" = pizza a mitades
        type: v.union(v.literal("full"), v.literal("half")),
        // For full: single product ID. For half: two product IDs
        productIds: v.array(v.id("products")),
        // Size of the pizza (both halves must match size)
        size: v.optional(v.string()),
        // Calculated price for this item
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
