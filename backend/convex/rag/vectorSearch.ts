import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Vector search using a pre-computed embedding vector.
// The embedding is generated on the Next.js side (localhost:7860).
export const searchByEmbedding = action({
  args: {
    embedding: v.array(v.float64()),
    category: v.optional(
      v.union(
        v.literal("pizza"),
        v.literal("bebida"),
        v.literal("postre"),
        v.literal("plato")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const results = await ctx.vectorSearch("products", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 10,
      filter: args.category
        ? (q) => q.eq("category", args.category!)
        : undefined,
    });

    if (results.length === 0) {
      return [];
    }

    const productIds = results.map((r) => r._id);
    const products = await ctx.runQuery(api.products.getByIds, {
      ids: productIds,
    });

    return products.map((product, index) => ({
      ...product,
      score: results[index]._score,
    }));
  },
});
