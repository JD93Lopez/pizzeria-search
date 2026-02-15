import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// No longer needed — the Next.js API route now orchestrates everything:
// 1. Saves user message (via saveMessage mutation)
// 2. Generates embedding locally (localhost:7860)
// 3. Searches products via Convex searchByEmbedding
// 4. Gets history (via getMessages query)
// 5. Calls Ollama locally (localhost:11434)
// 6. Saves assistant response (via saveMessage mutation)

// Save a message to the thread
export const saveMessage = mutation({
  args: {
    threadId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// Get messages for a thread
export const getMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

// Create a new thread
export const createThread = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      createdAt: now,
      updatedAt: now,
    });
  },
});
