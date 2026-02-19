/**
 * Public actions, queries and mutations for the chat interface.
 * Uses @convex-dev/agent for thread/message management and
 * @convex-dev/rag for product catalog indexing.
 */
import { action, query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { pizzaAgent } from "./agent";
import { rag } from "./ragSetup";
import { api, components } from "../_generated/api";
import { createThread, listUIMessages } from "@convex-dev/agent";

// ── Thread Management ────────────────────────────────────────────

/** Create a new conversation thread. */
export const startThread = mutation({
  handler: async (ctx) => {
    const threadId = await createThread(ctx, components.agent);
    return threadId;
  },
});

// ── Chat ─────────────────────────────────────────────────────────

/** Send a user message and get an agent response. */
export const sendMessage = action({
  args: {
    threadId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { threadId, message }) => {
    const result = await pizzaAgent.generateText(
      ctx,
      { threadId },
      { prompt: message }
    );

    // result.text may be empty when the last step was a tool call.
    // In that case, read the latest assistant message from the thread.
    let response = result.text || "";

    if (!response) {
      const msgs = await listUIMessages(ctx, components.agent, {
        threadId,
        paginationOpts: { numItems: 50, cursor: null },
      });
      const last = [...msgs.page]
        .reverse()
        .find((m) => m.role === "assistant" && (m.text ?? "").trim() !== "");
      response = last?.text ?? "";
    }

    return { response };
  },
});

// ── Messages ─────────────────────────────────────────────────────

/** Get all messages for a thread (mapped to frontend-friendly format). */
export const getMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const result = await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts: { numItems: 100, cursor: null },
    });

    // Map UIMessage → frontend-compatible shape
    return result.page
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        _id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.text ?? "",
        createdAt: msg._creationTime ?? Date.now(),
      }));
  },
});

// ── RAG Indexing ─────────────────────────────────────────────────

/**
 * Reindex products into the RAG component.
 *
 * Run in batches to avoid Cloudflare tunnel timeouts (~90s limit):
 *   npx convex run ai/actions:reindexProducts '{"startFrom":0,"limit":50}'
 *   npx convex run ai/actions:reindexProducts '{"startFrom":50,"limit":50}'
 *   ...etc
 *
 * @param startFrom  0-based position to resume from (default 0).
 * @param limit      Max products to process in this call (default 50).
 * @param stopOnError  Stop at first error instead of skipping (default false).
 */
export const reindexProducts = action({
  args: {
    startFrom: v.optional(v.number()),
    limit: v.optional(v.number()),
    stopOnError: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { startFrom = 0, limit = 50, stopOnError = false }
  ): Promise<{
    indexed: number;
    total: number;
    nextFrom: number;
    done: boolean;
    errors?: string[];
  }> => {
    const products: Array<{
      _id: string;
      name: string;
      price: number;
      category: string;
      size?: string;
      ingredients: string[];
      description: string;
      quantity?: number;
      available: boolean;
      tags: string[];
    }> = await ctx.runQuery(api.products.list, {});

    const total = products.length;
    const slice = products.slice(startFrom, startFrom + limit);
    let indexed = 0;
    let lastIndex = startFrom;
    const errors: string[] = [];

    console.log(
      `[reindex] Batch ${startFrom}–${startFrom + slice.length - 1}/${total - 1} (${slice.length} products)`
    );

    for (let i = 0; i < slice.length; i++) {
      const product = slice[i];
      const globalPos = startFrom + i;

      try {
        const text = [
          `Producto: ${product.name}`,
          `Precio: $${product.price}`,
          `Categoría: ${product.category}`,
          product.size ? `Tamaño: ${product.size}` : null,
          `Ingredientes: ${product.ingredients.join(", ")}`,
          product.description ? `Descripción: ${product.description}` : null,
          `Disponible: ${product.available ? "sí" : "no"}`,
          product.quantity != null ? `Stock: ${product.quantity}` : null,
          product.tags?.length ? `Tags: ${product.tags.join(", ")}` : null,
        ]
          .filter(Boolean)
          .join(" | ");

        await rag.add(ctx, {
          namespace: "products",
          key: product._id,
          text,
        });

        indexed++;
        lastIndex = globalPos + 1;
        console.log(`[reindex] ✓ [${globalPos + 1}/${total}] ${product.name}`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`[${globalPos}] ${product.name}: ${msg}`);
        console.error(`[reindex] ✗ [${globalPos + 1}/${total}] ${product.name}: ${msg}`);
        if (stopOnError) {
          console.log(`[reindex] Stopped. Resume with: startFrom=${globalPos}`);
          break;
        }
      }
    }

    const nextFrom = lastIndex;
    const done = nextFrom >= total;
    console.log(
      `[reindex] Batch done. indexed=${indexed}, nextFrom=${nextFrom}, done=${done}`
    );

    return {
      indexed,
      total,
      nextFrom,
      done,
      ...(errors.length > 0 ? { errors } : {}),
    };
  },
});
