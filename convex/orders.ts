/**
 * Order management with real-time inventory control.
 *
 * Supports full pizzas and half-and-half orders:
 * - Full: deducts `quantity` units from one product.
 * - Half: deducts `0.5 × quantity` units from each of two products.
 * Cancelled orders restore the deducted inventory.
 */
import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { orderItemValidator } from "./shared/validators";

// ── Stock helpers ────────────────────────────────────────────────

/** Deduct stock for a full pizza item. */
async function deductFullStock(
  ctx: MutationCtx,
  productId: Id<"products">,
  quantity: number
) {
  const product = await ctx.db.get(productId);
  if (!product) throw new Error(`Producto no encontrado: ${productId}`);
  const stock = product.quantity ?? 0;
  if (stock < quantity) {
    throw new Error(
      `Cantidad insuficiente para ${product.name}. Disponible: ${stock}, Solicitado: ${quantity}`
    );
  }
  await ctx.db.patch(productId, {
    quantity: stock - quantity,
    available: stock - quantity > 0,
  });
}

/** Deduct stock for a half-and-half pizza item. */
async function deductHalfStock(
  ctx: MutationCtx,
  productIds: Id<"products">[],
  quantity: number
) {
  const [product1, product2] = await Promise.all([
    ctx.db.get(productIds[0]),
    ctx.db.get(productIds[1]),
  ]);
  if (!product1 || !product2) {
    throw new Error(`Uno o ambos productos no encontrados: ${productIds}`);
  }
  const halfToDeduct = quantity * 0.5;
  const stock1 = product1.quantity ?? 0;
  const stock2 = product2.quantity ?? 0;
  if (stock1 < halfToDeduct) {
    throw new Error(
      `Cantidad insuficiente para ${product1.name}. Disponible: ${stock1}, Solicitado: ${halfToDeduct}`
    );
  }
  if (stock2 < halfToDeduct) {
    throw new Error(
      `Cantidad insuficiente para ${product2.name}. Disponible: ${stock2}, Solicitado: ${halfToDeduct}`
    );
  }
  await Promise.all([
    ctx.db.patch(productIds[0], {
      quantity: stock1 - halfToDeduct,
      available: stock1 - halfToDeduct > 0,
    }),
    ctx.db.patch(productIds[1], {
      quantity: stock2 - halfToDeduct,
      available: stock2 - halfToDeduct > 0,
    }),
  ]);
}

/** Restore stock for a full pizza item. */
async function restoreFullStock(ctx: MutationCtx, productId: Id<"products">, quantity: number) {
  const product = await ctx.db.get(productId);
  if (product) {
    await ctx.db.patch(productId, {
      quantity: (product.quantity ?? 0) + quantity,
      available: true,
    });
  }
}

/** Restore stock for a half-and-half pizza item. */
async function restoreHalfStock(
  ctx: MutationCtx,
  productIds: Id<"products">[],
  quantity: number
) {
  const [product1, product2] = await Promise.all([
    ctx.db.get(productIds[0]),
    ctx.db.get(productIds[1]),
  ]);
  const halfToRestore = quantity * 0.5;
  if (product1) {
    await ctx.db.patch(productIds[0], {
      quantity: (product1.quantity ?? 0) + halfToRestore,
      available: true,
    });
  }
  if (product2) {
    await ctx.db.patch(productIds[1], {
      quantity: (product2.quantity ?? 0) + halfToRestore,
      available: true,
    });
  }
}

// Create an order
/** Create a new order, deducting inventory for each item. */
export const create = mutation({
  args: {
    threadId: v.string(),
    items: v.array(orderItemValidator),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify availability and deduct inventory
    for (const item of args.items) {
      if (item.type === "full") {
        await deductFullStock(ctx, item.productIds[0], item.quantity);
      } else if (item.type === "half") {
        await deductHalfStock(ctx, item.productIds, item.quantity);
      }
    }

    return await ctx.db.insert("orders", {
      threadId: args.threadId,
      status: "pending",
      items: args.items,
      total: args.total,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Confirm an order
/** Mark an order as confirmed (no inventory change). */
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
/** Cancel a pending order and restore all reserved inventory. */
export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Orden no encontrada");
    if (order.status !== "pending") {
      throw new Error("Solo se pueden cancelar órdenes pendientes");
    }

    // Restore inventory
    for (const item of order.items) {
      if (item.type === "full") {
        await restoreFullStock(ctx, item.productIds[0], item.quantity);
      } else if (item.type === "half") {
        await restoreHalfStock(ctx, item.productIds, item.quantity);
      }
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

// Get order by ID
/** Get a single order by its Convex document ID. */
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get orders by thread
/** Get all orders associated with a chat thread, newest last. */
export const getByThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});
