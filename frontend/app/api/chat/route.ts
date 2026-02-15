import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

// Simple proxy to Convex backend - all processing happens there now
export async function POST(request: NextRequest) {
  try {
    const { query, threadId } = await request.json();

    if (!query || !threadId) {
      return NextResponse.json(
        { error: "Missing query or threadId" },
        { status: 400 }
      );
    }

    // Call Convex action that handles everything
    const result = await convex.action(
      api.agents.pizzaAgent.processChatMessage,
      { query, threadId }
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
