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

// Generate embedding using local lightweight_embeddings server
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:7860/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
