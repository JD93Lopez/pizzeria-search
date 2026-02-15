import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Message persistence — save and retrieve chat messages per thread.
 */

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

export const getMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});
