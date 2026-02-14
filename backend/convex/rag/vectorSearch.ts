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

// Generate embedding using OpenAI (placeholder - requires API key)
async function generateEmbedding(text: string): Promise<number[]> {
  // In production, use OpenAI API:
  // const response = await fetch("https://api.openai.com/v1/embeddings", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     input: text,
  //     model: "text-embedding-ada-002",
  //   }),
  // });
  // const data = await response.json();
  // return data.data[0].embedding;

  // For now, return a mock embedding (1536 dimensions for ada-002)
  // This should be replaced with actual OpenAI call
  const hash = simpleHash(text);
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.sin(hash + i) * 0.5 + 0.5);
  }
  return embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}
