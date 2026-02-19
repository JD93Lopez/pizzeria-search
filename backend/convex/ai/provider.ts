/**
 * AI SDK providers configured for:
 * 1. OpenRouter — LLM chat (aurora-alpha, etc.)
 * 2. Local embedding server — custom fetch-based model (avoids AI SDK version
 *    conflicts between @convex-dev/agent (ai@5/provider@2) and
 *    @convex-dev/rag (ai@6/provider@3)).
 *
 * @ai-sdk/openai-compatible@1.x → @ai-sdk/provider@2.x → LanguageModelV2
 * This matches @convex-dev/agent's requirement of ai@5 (LanguageModelV2).
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** OpenRouter provider for LLM chat models. */
export const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://pizzeria-app.local",
    "X-Title": "Pizzeria Assistant",
  },
});

/**
 * Custom embedding model that directly calls the local embedding server via
 * fetch. Implements EmbeddingModelV2<string> (the interface @convex-dev/rag
 * expects from ai@6 / @ai-sdk/provider@3), without depending on any SDK
 * version.
 */
export function createLocalEmbeddingModel({
  baseURL,
  model,
  dimensions,
}: {
  baseURL: string;
  model: string;
  dimensions: number;
}) {
  return {
    specificationVersion: "v2" as const,
    provider: "local-embeddings",
    modelId: model,
    maxEmbeddingsPerCall: 32,
    supportsParallelCalls: false,
    async doEmbed({
      values,
    }: {
      values: string[];
      abortSignal?: AbortSignal;
      headers?: Record<string, string | undefined>;
      providerOptions?: Record<string, Record<string, unknown>>;
    }) {
      const url = baseURL.replace(/\/$/, "") + "/embeddings";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: values, model }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Embedding server error ${res.status}: ${body}`);
      }
      const json = (await res.json()) as {
        data: { embedding: number[] }[];
        usage?: { prompt_tokens?: number };
      };
      return {
        embeddings: json.data.map((d) => d.embedding) as number[][],
        usage: json.usage?.prompt_tokens
          ? { tokens: json.usage.prompt_tokens }
          : undefined,
        rawCall: { rawInput: values, rawSettings: { model } },
        warnings: [] as [],
      };
    },
  };
}
