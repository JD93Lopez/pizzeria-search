import { internalMutation, internalAction } from "../_generated/server";
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
  handler: async (ctx) => {
    const products = await ctx.runQuery(internal.rag.productIndexer.getAllProducts as any);
    
    for (const product of products) {
      const text = `${product.name} ${product.description} ${product.ingredients.join(" ")} ${product.tags.join(" ")}`;
      const embedding = await generateEmbedding(text);
      
      await ctx.runMutation(internal.rag.productIndexer.indexProduct, {
        productId: product._id,
        embedding,
      });
    }
    
    return { indexed: products.length };
  },
});

// Get all products for indexing
export const getAllProducts = internalMutation({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding generator - replace with OpenAI in production
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
