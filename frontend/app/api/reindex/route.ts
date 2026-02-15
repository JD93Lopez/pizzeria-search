import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const EMBEDDINGS_URL =
  process.env.EMBEDDINGS_URL || "http://localhost:7860/v1/embeddings";
const EMBEDDINGS_MODEL =
  process.env.EMBEDDINGS_MODEL || "multilingual-e5-large";

async function generateEmbedding(text: string): Promise<number[]> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: [text],
          model: EMBEDDINGS_MODEL,
        }),
      });

      if (!response.ok) {
        const isRetryable =
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;
        if (attempt < maxRetries && isRetryable) {
          await new Promise((r) => setTimeout(r, baseDelay * attempt));
          continue;
        }
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error: any) {
      if (
        attempt < maxRetries &&
        (error instanceof TypeError || error?.message?.includes("fetch"))
      ) {
        await new Promise((r) => setTimeout(r, baseDelay * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached for embedding generation");
}

// POST /api/reindex — Reindex all products using localhost embeddings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const startFrom: number = body.startFrom ?? 0;

    // Get all products from Convex
    const products: any[] = await convex.query(api.products.list, {});

    console.log(
      `Starting to index ${products.length} products (from #${startFrom + 1})...`
    );

    let indexed = 0;
    const errors: string[] = [];

    for (let i = startFrom; i < products.length; i++) {
      const product = products[i];

      try {
        const text = product.name + product.ingredients.join(" ");
        const embedding = await generateEmbedding(text);

        await convex.mutation(api.rag.productIndexer.indexProductPublic, {
          productId: product._id,
          embedding,
        });

        indexed++;

        if (indexed % 50 === 0) {
          console.log(
            `Indexed ${indexed} products (at #${i + 1}/${products.length})...`
          );
        }
      } catch (error: any) {
        const msg = `Failed product #${i + 1} (${product.name}): ${error.message}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    console.log(`Finished indexing ${indexed} products`);

    return NextResponse.json({
      indexed,
      total: products.length,
      startedFrom: startFrom,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json(
      { error: "Error during reindexing" },
      { status: 500 }
    );
  }
}
