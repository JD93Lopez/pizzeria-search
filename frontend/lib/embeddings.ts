/**
 * Embedding generation client — calls the local embedding server (localhost:7860).
 * Shared between the chat and reindex API routes.
 */

const EMBEDDINGS_URL =
  process.env.EMBEDDINGS_URL || "http://localhost:7860/v1/embeddings";
const EMBEDDINGS_MODEL =
  process.env.EMBEDDINGS_MODEL || "multilingual-e5-large";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

/**
 * Generate an embedding vector for the given text.
 * Returns `null` if all retry attempts fail (non-throwing variant for chat).
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: [text], model: EMBEDDINGS_MODEL }),
      });

      if (!response.ok) {
        if (attempt < MAX_RETRIES && RETRYABLE_STATUS_CODES.has(response.status)) {
          console.log(
            `Embedding API error ${response.status}, retrying (${attempt}/${MAX_RETRIES})...`
          );
          await delay(BASE_DELAY_MS * attempt);
          continue;
        }
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error: any) {
      if (attempt < MAX_RETRIES && isNetworkError(error)) {
        console.log(
          `Network error on embedding, retrying (${attempt}/${MAX_RETRIES})...`
        );
        await delay(BASE_DELAY_MS * attempt);
        continue;
      }
      console.error("Embedding generation failed:", error);
      return null;
    }
  }

  console.error("Max retries reached for embedding generation");
  return null;
}

/**
 * Strict variant that throws on failure (used by reindex, where failure matters).
 */
export async function generateEmbeddingStrict(text: string): Promise<number[]> {
  const result = await generateEmbedding(text);
  if (!result) {
    throw new Error("Embedding generation failed after all retries");
  }
  return result;
}

// ── Private helpers ──────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isNetworkError(error: any): boolean {
  return error instanceof TypeError || error?.message?.includes("fetch");
}
