import { internalMutation, internalAction, internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// Index products with embeddings
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

// Reindex all products
export const reindexAll = internalAction({
  args: {
    startFrom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.runQuery(internal.rag.productIndexer.getAllProducts as any);
    const startIndex = args.startFrom ?? 0;
    
    console.log(`Starting to index ${products.length} products (starting from #${startIndex + 1})...`);
    let indexed = 0;
    
    for (let i = startIndex; i < products.length; i++) {
      const product = products[i];
      
      try {
        // const text = `${product.name} ${product.description} ${product.ingredients.join(" ")} ${product.tags.join(" ")}`;
        const text = `${product.name}`;
        const embedding = await generateEmbedding(text);
        
        await ctx.runMutation(internal.rag.productIndexer.indexProduct, {
          productId: product._id,
          embedding,
        });
        
        indexed++;
        
        // Log progress every 50 products
        if (indexed % 50 === 0) {
          console.log(`Indexed ${indexed} products (currently at #${i + 1}/${products.length})...`);
        }
      } catch (error) {
        console.error(`Failed to index product #${i + 1} (${product.name}):`, error);
      }
    }
    
    console.log(`Finished indexing ${indexed} products`);
    return { indexed, total: products.length, startedFrom: startIndex };
  },
});

// Public action to trigger reindexing
export const reindexAllProducts = action({
  args: {
    startFrom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runAction(internal.rag.productIndexer.reindexAll, {
      startFrom: args.startFrom,
    });
    return result;
  },
});

// Get all products for indexing
export const getAllProducts = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Generate embedding using embeddings server (via tunnel)
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
      return data.data[0].embedding;
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
