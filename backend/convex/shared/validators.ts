import { v } from "convex/values";

/**
 * Shared Convex validators to avoid repetition across modules.
 * Single source of truth for category, size, and product field validators.
 */

// ── Category & Size ──────────────────────────────────────────────
export const categoryValidator = v.union(
  v.literal("pizza"),
  v.literal("bebida"),
  v.literal("postre"),
  v.literal("plato")
);

export const sizeValidator = v.union(
  v.literal("individual"),
  v.literal("pequeña"),
  v.literal("mediana"),
  v.literal("grande"),
  v.literal("familiar")
);

// ── Product fields (reusable across create / update / createMany) ─
export const productFields = {
  name: v.string(),
  description: v.string(),
  category: categoryValidator,
  size: v.optional(sizeValidator),
  flavors: v.optional(v.array(v.string())),
  price: v.number(),
  available: v.boolean(),
  quantity: v.number(),
  ingredients: v.array(v.string()),
  tags: v.array(v.string()),
};

// ── Order item validator ─────────────────────────────────────────
export const orderItemValidator = v.object({
  type: v.union(v.literal("full"), v.literal("half")),
  productIds: v.array(v.id("products")),
  size: v.optional(v.string()),
  price: v.number(),
  quantity: v.number(),
});
