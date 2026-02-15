import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddingStrict } from "@/lib/embeddings";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

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
        const embedding = await generateEmbeddingStrict(text);

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
