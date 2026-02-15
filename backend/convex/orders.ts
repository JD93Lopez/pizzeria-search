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
    
    // Verificar disponibilidad y descontar del inventario
    for (const item of args.items) {
      if (item.type === "full") {
        // Pizza completa: descuenta 1 unidad por cantidad
        const product = await ctx.db.get(item.productIds[0]);
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.productIds[0]}`);
        }
        
        const totalToDeduct = item.quantity;
        if (product.quantity < totalToDeduct) {
          throw new Error(`Cantidad insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${totalToDeduct}`);
        }
        
        await ctx.db.patch(item.productIds[0], {
          quantity: product.quantity - totalToDeduct,
          available: product.quantity - totalToDeduct > 0
        });
        
      } else if (item.type === "half") {
        // Media pizza: descuenta 0.5 unidades de cada sabor
        const [product1, product2] = await Promise.all([
          ctx.db.get(item.productIds[0]),
          ctx.db.get(item.productIds[1])
        ]);
        
        if (!product1 || !product2) {
          throw new Error(`Uno o ambos productos no encontrados: ${item.productIds}`);
        }
        
        const halfToDeduct = item.quantity * 0.5;
        
        if (product1.quantity < halfToDeduct) {
          throw new Error(`Cantidad insuficiente para ${product1.name}. Disponible: ${product1.quantity}, Solicitado: ${halfToDeduct}`);
        }
        if (product2.quantity < halfToDeduct) {
          throw new Error(`Cantidad insuficiente para ${product2.name}. Disponible: ${product2.quantity}, Solicitado: ${halfToDeduct}`);
        }
        
        await Promise.all([
          ctx.db.patch(item.productIds[0], {
            quantity: product1.quantity - halfToDeduct,
            available: product1.quantity - halfToDeduct > 0
          }),
          ctx.db.patch(item.productIds[1], {
            quantity: product2.quantity - halfToDeduct,
            available: product2.quantity - halfToDeduct > 0
          })
        ]);
      }
    }
    
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
    // Obtener la orden antes de cancelarla
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Orden no encontrada");
    }
    
    if (order.status !== "pending") {
      throw new Error("Solo se pueden cancelar órdenes pendientes");
    }
    
    // Restaurar el inventario
    for (const item of order.items) {
      if (item.type === "full") {
        // Pizza completa: restaura 1 unidad por cantidad
        const product = await ctx.db.get(item.productIds[0]);
        if (product) {
          await ctx.db.patch(item.productIds[0], {
            quantity: product.quantity + item.quantity,
            available: true
          });
        }
        
      } else if (item.type === "half") {
        // Media pizza: restaura 0.5 unidades de cada sabor
        const [product1, product2] = await Promise.all([
          ctx.db.get(item.productIds[0]),
          ctx.db.get(item.productIds[1])
        ]);
        
        const halfToRestore = item.quantity * 0.5;
        
        if (product1) {
          await ctx.db.patch(item.productIds[0], {
            quantity: product1.quantity + halfToRestore,
            available: true
          });
        }
        if (product2) {
          await ctx.db.patch(item.productIds[1], {
            quantity: product2.quantity + halfToRestore,
            available: true
          });
        }
      }
    }
    
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
