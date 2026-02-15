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

// Generate embedding locally (runs on your machine, reaches localhost:7860)
async function generateEmbedding(text: string): Promise<number[] | null> {
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
          console.log(
            `Embedding API error ${response.status}, retrying (${attempt}/${maxRetries})...`
          );
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
        console.log(
          `Network error on embedding, retrying (${attempt}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, baseDelay * attempt));
        continue;
      }
      console.error("Embedding generation failed:", error);
      return null;
    }
  }
  console.error("Max retries reached for embedding generation");
  return null;
}

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
      api.agents.pizzaAgent.processChatMessage,
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
