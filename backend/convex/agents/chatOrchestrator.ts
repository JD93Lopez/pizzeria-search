import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { SYSTEM_PROMPT } from "./prompts";

/**
 * Chat orchestrator — single action that coordinates the full chat flow:
 *   1. Save user message
 *   2. Vector search with pre-computed embedding
 *   3. Build conversation context
 *   4. Call OpenRouter LLM
 *   5. Save assistant response
 *
 * Embedding is generated in the frontend (localhost:7860) and passed here.
 */

// ── Interfaces ────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProductResult {
  name: string;
  price: number;
  category: string;
  size?: string;
  quantity: number;
  description: string;
  available: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

/** Build the OpenRouter messages array from history + product context. */
function buildMessages(
  history: { role: string; content: string }[],
  products: ProductResult[],
  userQuery: string
): ChatMessage[] {
  const recentHistory = history.slice(-20);

  const userContent =
    products.length > 0
      ? `Productos encontrados en la nueva búsqueda:\n${products
          .map(
            (p, i) =>
              `${i + 1}. "${p.name}" - $${p.price} | Categoría: ${p.category} | Tamaño: ${p.size || "N/A"} | Stock: ${p.quantity}`
          )
          .join("\n")}\n\n${userQuery}`
      : userQuery;

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userContent },
  ];
}

/** Call the OpenRouter chat completions API. */
async function callOpenRouter(
  messages: ChatMessage[],
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pizzeria-app.local",
        "X-Title": "Pizzeria Assistant",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return (
    (data as any).choices[0]?.message?.content?.trim() ||
    "Lo siento, no pude generar una respuesta."
  );
}

/** Build a fallback response when the LLM call fails. */
function buildFallbackResponse(
  errorMessage: string,
  products: ProductResult[]
): string {
  let response = `⚠️ No pude conectar con el servicio de chat. ${errorMessage}`;

  if (products.length > 0) {
    response += "\n\nMientras tanto, estos son los productos que encontré:\n\n";
    response += products
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}** - $${p.price}\n   ${p.description}\n   Stock: ${p.quantity} | ${p.available ? "✅ Disponible" : "❌ Agotado"}`
      )
      .join("\n\n");
  }

  return response;
}

// ── Action ────────────────────────────────────────────────────────

export const processChatMessage = action({
  args: {
    query: v.string(),
    threadId: v.string(),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const { query, threadId, embedding } = args;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL =
      process.env.OPENROUTER_MODEL || "openrouter/aurora-alpha";

    if (!OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY not configured in backend environment"
      );
    }

    // 1. Save user message
    await ctx.runMutation(api.agents.messageService.saveMessage, {
      threadId,
      role: "user",
      content: query,
    });

    // 2. Search products with pre-computed embedding
    let products: ProductResult[] = [];
    if (embedding) {
      try {
        products = await ctx.runAction(api.rag.vectorSearch.searchByEmbedding, {
          embedding,
          limit: 8,
        });
      } catch (e) {
        console.error("Vector search failed:", e);
      }
    }

    // 3. Get conversation history
    const history = await ctx.runQuery(
      api.agents.messageService.getMessages,
      { threadId }
    );

    // 4. Call LLM
    const messages = buildMessages(history, products, query);
    let assistantResponse: string;

    try {
      assistantResponse = await callOpenRouter(
        messages,
        OPENROUTER_API_KEY,
        OPENROUTER_MODEL
      );
    } catch (error: any) {
      console.error("OpenRouter call failed:", error);
      assistantResponse = buildFallbackResponse(error.message, products);
    }

    // 5. Save assistant response
    await ctx.runMutation(api.agents.messageService.saveMessage, {
      threadId,
      role: "assistant",
      content: assistantResponse,
    });

    return { response: assistantResponse };
  },
});
