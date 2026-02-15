import { mutation } from "../_generated/server";

/**
 * Thread management — create conversation threads.
 */

export const createThread = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      createdAt: now,
      updatedAt: now,
    });
  },
});
