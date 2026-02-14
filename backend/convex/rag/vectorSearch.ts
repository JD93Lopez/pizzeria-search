import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Vector search for products using embeddings
export const searchProducts = action({
  args: {
    query: v.string(),
    category: v.optional(
      v.union(
        v.literal("pizza"),
        v.literal("bebida"),
        v.literal("postre"),
        v.literal("combo")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const embedding = await generateEmbedding(args.query);

    //TODO remove
    console.log("Generated embedding:", embedding);

    const results = await ctx.vectorSearch("products", "by_embedding", {
      vector: embedding,
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

// Generate embedding using local lightweight_embeddings server
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://zkg6bqjr-7860.use2.devtunnels.ms/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: "multilingual-e5-small",
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const embedding = data.data[0].embedding;

  console.log(embedding);
  
  return embedding;
}
