import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

/**
 * POST /api/reindex — Reindex all products using the RAG component.
 * Embedding generation is now handled entirely in the backend.
 */
export async function POST(_request: NextRequest) {
  try {
    const result = await convex.action(api.ai.actions.reindexProducts, {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json(
      { error: "Error during reindexing" },
      { status: 500 }
    );
  }
}
