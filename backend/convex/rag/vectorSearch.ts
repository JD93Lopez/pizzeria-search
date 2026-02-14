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

// Generate embedding using local lightweight_embeddings server
async function generateEmbedding(text: string): Promise<number[]> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("http://zkg6bqjr-7860.use2.devtunnels.ms/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: [text],
          model: "multilingual-e5-large",
        }),
      });

      if (!response.ok) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = response.status === 504 || response.status === 502 || response.status === 503;
        
        if (!isLastAttempt && isRetryableError) {
          console.log(`Embedding API error ${response.status}, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
          continue;
        }
        
        throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      // console.log(embedding);
      
      return embedding;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (!isLastAttempt && (error instanceof TypeError || error.message.includes('fetch'))) {
        console.log(`Network error on embedding request, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries reached for embedding generation');
}
