/**
 * Pizzeria ordering agent — uses @convex-dev/agent with tool calling.
 * The LLM decides when to search the catalog via the searchCatalog tool.
 */
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { openrouter } from "./provider";
import { SYSTEM_PROMPT } from "./prompts";
import { rag } from "./ragSetup";
import { z } from "zod";

/** A single content chunk returned by RAG search results. */
interface RagContentChunk {
  text: string;
  metadata?: Record<string, unknown>;
}

/** A single result entry from rag.search(). */
interface RagSearchResult {
  entryId: string;
  order: number;
  startOrder: number;
  score: number;
  content: RagContentChunk[];
}

/**
 * Tool: searchCatalog
 * The LLM calls this when it needs to look up products in the pizzeria catalog.
 * RAG handles embedding generation and vector search automatically.
 */
const searchCatalog = createTool({
  description:
    "Buscar productos en el catálogo de la pizzería por nombre, ingrediente, categoría o descripción. " +
    "Usa esta herramienta cuando el usuario pregunte por productos, precios, o disponibilidad.",
  args: z.object({
    query: z
      .string()
      .describe("Texto de búsqueda para encontrar productos en el catálogo"),
  }),
  handler: async (ctx: ActionCtx, args: { query: string }): Promise<string> => {
    const { results } = (await rag.search(ctx, {
      namespace: "products",
      query: args.query,
      limit: 8,
    })) as unknown as { results: RagSearchResult[] };

    if (results.length === 0) {
      return "No se encontraron productos para esa búsqueda.";
    }

    return results
      .map((r, i) => `${i + 1}. ${r.content.map((c) => c.text).join(" ")}`)
      .join("\n\n");
  },
});

/**
 * The main agent instance. Uses OpenRouter for LLM calls and the RAG component
 * for catalog search via tool calling. maxSteps ≥ 2 ensures the agent can
 * call a tool and then generate a final text response in the same turn.
 */
export const pizzaAgent = new Agent(components.agent, {
  name: "Pizzeria Assistant",
  languageModel: openrouter.chatModel(
    process.env.OPENROUTER_MODEL || "openrouter/aurora-alpha"
  ),
  instructions: SYSTEM_PROMPT,
  tools: { searchCatalog },
  maxSteps: 10,
});

