import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Order management functions
const orderItemValidator = v.object({
  type: v.union(v.literal("full"), v.literal("half")),
  productIds: v.array(v.id("products")),
  size: v.optional(v.string()),
  price: v.number(),
  quantity: v.number(),
});

// Create an order
export const create = mutation({
  args: {
    threadId: v.string(),
    items: v.array(orderItemValidator),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("orders", {
      threadId: args.threadId,
      status: "pending",
      items: args.items,
      total: args.total,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Confirm an order
export const confirm = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "confirmed",
      updatedAt: Date.now(),
    });
  },
});

// Cancel an order
export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

// Get order by ID
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get orders by thread
export const getByThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});
