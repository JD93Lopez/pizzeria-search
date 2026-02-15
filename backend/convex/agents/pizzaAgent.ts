import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

const SYSTEM_PROMPT = `Eres el asistente virtual de una pizzería. Tu única función es tomar pedidos con precisión. Sigue ESTRICTAMENTE estas reglas:

### 1. ESTADO DEL PEDIDO (CRÍTICO)
- Mantén internamente un estado acumulado: lista de items + total exacto.
- CADA VEZ que agregues un item, muestra INMEDIATAMENTE este formato:
Tu pedido:
• [Cantidad]x [Producto] → [precio unitario]
TOTAL: $[suma exacta]

- Nunca omitas el TOTAL después de cada acción.

### 2. BÚSQUEDA Y SELECCIÓN (CONCISO)
- Al recibir resultados del catálogo, muestra SOLO:
**[Nombre]** → $[precio] | [2-3 ingredientes clave]
- Máximo 6 opciones. Sin explicaciones largas.
- Muestra siempre opciones del catálogo no las inventes.
- Cuando el usuario elija uno: confirma en 1 línea y actualiza el resumen con total.

### 3. PIZZAS MITAD Y MITAD (REGLA EXPLÍCITA)
- SOLO permitido si ambas mitades son del MISMO tamaño.
- Precio final = el precio de la pizza de mayor valor.
- Descuento de inventario: -0.5 unidades de cada sabor.
- Si falta stock o tamaños distintos: rechaza inmediatamente y explica por qué.

### 4. FLUJO OBLIGATORIO
1. Usuario pide → tú muestras opciones concisas
2. Usuario elige → tú confirmas: "✅ Agregado: [producto]" + resumen con TOTAL
3. Repite hasta confirmación final
4. Al confirmar: muestra resumen final idéntico al formato de arriba + "¿Confirmas tu pedido?"

### 5. PROHIBIDO
- Inventar productos o precios
- Mostrar stock numérico (solo "poco disponible" si quantity ≤ 2)
- Sugerir productos sin que el usuario pida primero
- Omitir el total acumulado en cualquier momento
- Usar más de 2 líneas para mostrar opciones

Responde siempre en español, cálido pero ultra-conciso. El total visible es OBLIGATORIO tras cada acción.
`;

// Process complete chat message (orchestrates entire flow)
export const processChatMessage = action({
  args: {
    query: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const { query, threadId } = args;

    // Get environment variables
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/aurora-alpha";
    const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL || "http://localhost:7860/v1/embeddings";
    const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL || "multilingual-e5-large";

    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not configured in backend environment");
    }

    // 1. Save user message
    await ctx.runMutation(api.agents.pizzaAgent.saveMessage, {
      threadId,
      role: "user",
      content: query,
    });

    // 2. Generate embedding
    let products: any[] = [];
    try {
      const embeddingResponse = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: [query],
          model: EMBEDDINGS_MODEL,
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // 3. Search products with vector search
        products = await ctx.runAction(api.rag.vectorSearch.searchByEmbedding, {
          embedding,
          limit: 8,
        });
      }
    } catch (e) {
      console.error("Embedding/search failed:", e);
    }

    // 4. Get conversation history
    const history = await ctx.runQuery(api.agents.pizzaAgent.getMessages, {
      threadId,
    });

    // 5. Prepare messages for OpenRouter
    const recentHistory = history.slice(-20);
    const messages: any[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...recentHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content:
          products.length > 0
            ? `Productos disponibles:\n${products
                .map(
                  (p: any, i: number) =>
                    `${i + 1}. "${p.name}" - $${p.price} | Categoría: ${
                      p.category
                    } | Tamaño: ${p.size || "N/A"} | Stock: ${p.quantity}`
                )
                .join("\n")}\n\n${query}`
            : query,
      },
    ];

    // 6. Call OpenRouter API
    let assistantResponse: string;
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pizzeria-app.local",
            "X-Title": "Pizzeria Assistant",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
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
      assistantResponse =
        data.choices[0]?.message?.content?.trim() ||
        "Lo siento, no pude generar una respuesta.";
    } catch (error: any) {
      console.error("OpenRouter call failed:", error);
      assistantResponse =
        "⚠️ No pude conectar con el servicio de chat. " + error.message;

      // Fallback: show products if available
      if (products.length > 0) {
        assistantResponse +=
          "\n\nMientras tanto, estos son los productos que encontré:\n\n";
        assistantResponse += products
          .map(
            (p: any, i: number) =>
              `${i + 1}. **${p.name}** - $${p.price}\n   ${p.description}\n   Stock: ${
                p.quantity
              } | ${p.available ? "✅ Disponible" : "❌ Agotado"}`
          )
          .join("\n\n");
      }
    }

    // 7. Save assistant response
    await ctx.runMutation(api.agents.pizzaAgent.saveMessage, {
      threadId,
      role: "assistant",
      content: assistantResponse,
    });

    return { response: assistantResponse };
  },
});

// Save a message to the thread
export const saveMessage = mutation({
  args: {
    threadId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// Get messages for a thread
export const getMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
  },
});

// Create a new thread
export const createThread = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      createdAt: now,
      updatedAt: now,
    });
  },
});
