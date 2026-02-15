import { internalMutation, internalQuery, action, mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// Index a single product with a pre-computed embedding
export const indexProduct = internalMutation({
  args: {
    productId: v.id("products"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      embedding: args.embedding,
    });
  },
});

// Public mutation to index a single product (called from Next.js API route)
export const indexProductPublic = mutation({
  args: {
    productId: v.id("products"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      embedding: args.embedding,
    });
  },
});

// Get all products for indexing (public query for Next.js API route)
export const getAllProducts = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});
