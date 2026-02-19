/**
 * Pizzeria ordering agent — uses @convex-dev/agent with tool calling.
 * The LLM decides when to search the catalog via the searchCatalog tool.
 */
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter } from "./provider";
import { SYSTEM_PROMPT } from "../agents/prompts";
import { rag } from "./ragSetup";
import { z } from "zod";

/**
 * Tool: searchCatalog
 * The LLM calls this tool when it needs to look up products in the
 * pizzeria catalog. RAG handles embedding generation + vector search.
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
  handler: async (ctx: any, args: any) => {
    const { query } = args as { query: string };
    const { results } = await rag.search(ctx, {
      namespace: "products",
      query,
      limit: 8,
    });

    if (results.length === 0) {
      return "No se encontraron productos para esa búsqueda.";
    }

    return results
      .map(
        (r: any, i: number) =>
          `${i + 1}. ${r.content.map((c: any) => c.text).join(" ")}`
      )
      .join("\n\n");
  },
} as any);

/**
 * The main agent instance. Uses OpenRouter for LLM calls and
 * the RAG component for catalog search via tool calling.
 * maxSteps=5 allows the LLM to call tools and then respond.
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
