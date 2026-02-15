import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { categoryValidator, sizeValidator, productFields } from "./shared/validators";

// Query: Get all products
export const list = query({
  args: {
    category: v.optional(categoryValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
      return args.limit ? products.slice(0, args.limit) : products;
    }

    const products = await ctx.db.query("products").collect();
    return args.limit ? products.slice(0, args.limit) : products;
  },
});

// Query: Get product by ID
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query: Get products by IDs
export const getByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return products.filter((p) => p !== null);
  },
});

// Mutation: Create a product
export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

// Mutation: Create many products (batch)
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

// Mutation: Update a product
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
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Mutation: Delete a product
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

// Mutation: Clear all products (for seeding)
export const clearAll = mutation({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    return products.length;
  },
});

// Mutation: Set all products quantity to a specific value (for testing)
export const setAllQuantities = mutation({
  args: { quantity: v.number() },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products").collect();
    let updated = 0;
    
    for (const product of products) {
      await ctx.db.patch(product._id, { 
        quantity: args.quantity,
        available: args.quantity > 0 
      });
      updated++;
    }
    
    return { updated, totalProducts: products.length };
  },
});
