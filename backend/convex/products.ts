/**
 * Product CRUD operations.
 *
 * Embeddings and vector search are handled by @convex-dev/rag —
 * no embedding fields are managed here.
 */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { categoryValidator, sizeValidator, productFields } from "./shared/validators";

// ── Queries ──────────────────────────────────────────────────────

/** List all products, optionally filtered by category and/or paginated. */
export const list = query({
  args: {
    category: v.optional(categoryValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = args.category
      ? await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .collect()
      : await ctx.db.query("products").collect();

    return args.limit ? products.slice(0, args.limit) : products;
  },
});

/** Get a single product by its Convex document ID. */
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

/** Get multiple products by their Convex document IDs. */
export const getByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return products.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});

// ── Mutations ────────────────────────────────────────────────────

/** Insert a new product into the catalog. */
export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    return ctx.db.insert("products", args);
  },
});

/** Insert multiple products in a single transaction (used for seeding). */
export const createMany = mutation({
  args: {
    products: v.array(v.object(productFields)),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const product of args.products) {
      const id = await ctx.db.insert("products", product);
      ids.push(id);
    }
    return ids;
  },
});

/** Update specific fields of an existing product. */
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(categoryValidator),
    size: v.optional(sizeValidator),
    flavors: v.optional(v.array(v.string())),
    price: v.optional(v.number()),
    available: v.optional(v.boolean()),
    quantity: v.optional(v.number()),
    ingredients: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return ctx.db.get(id);
  },
});

/** Delete a product by ID. */
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

/** Delete all products — used during catalog seeding. */
export const clearAll = mutation({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    return products.length;
  },
});

/** Set all products to the same stock quantity — used for testing. */
export const setAllQuantities = mutation({
  args: { quantity: v.number() },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.patch(product._id, {
        quantity: args.quantity,
        available: args.quantity > 0,
      });
    }
    return { updated: products.length };
  },
});
