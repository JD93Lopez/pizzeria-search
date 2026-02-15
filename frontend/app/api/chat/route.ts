import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export async function POST(request: NextRequest) {
  try {
    const { query, threadId } = await request.json();

    if (!query || !threadId) {
      return NextResponse.json(
        { error: "Missing query or threadId" },
        { status: 400 }
      );
    }

    // 1. Generate embedding locally (localhost:7860)
    const embedding = await generateEmbedding(query);

    // 2. Call Convex action with pre-computed embedding
    const result = await convex.action(
      api.agents.chatOrchestrator.processChatMessage,
      { query, threadId, embedding: embedding || undefined }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error processing chat message" },
      { status: 500 }
    );
  }
}
