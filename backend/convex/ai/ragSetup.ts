/**
 * RAG component instance — manages embeddings and vector search
 * for the product catalog. Embeddings are generated in the backend
 * via the local embedding server (multilingual-e5-large, dim 1024).
 */
import { RAG } from "@convex-dev/rag";
import { components } from "../_generated/api";
import { createLocalEmbeddingModel } from "./provider";

export const rag = new RAG(components.rag, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textEmbeddingModel: createLocalEmbeddingModel({
    baseURL:
      process.env.EMBEDDINGS_URL ||
      "https://kit-scott-hist-hang.trycloudflare.com/v1",
    model: process.env.EMBEDDINGS_MODEL || "multilingual-e5-large",
    dimensions: 1024,
  }) as any,
  embeddingDimension: 1024,
});
