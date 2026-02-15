import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const EMBEDDINGS_URL =
  process.env.EMBEDDINGS_URL || "http://localhost:7860/v1/embeddings";
const EMBEDDINGS_MODEL =
  process.env.EMBEDDINGS_MODEL || "multilingual-e5-large";
const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

const SYSTEM_PROMPT = `Eres el asistente virtual de una pizzería. Tu única función es tomar pedidos con precisión. Sigue ESTRICTAMENTE estas reglas:

### 1. ESTADO DEL PEDIDO (CRÍTICO)
- Mantén internamente un estado acumulado: lista de items + total exacto.
- CADA VEZ que agregues un item, muestra INMEDIATAMENTE este formato:
Tu pedido:
• [Cantidad]x [Producto] →[preciounitario]•[Cantidad]x[Producto]→[precio unitario]
TOTAL: $[suma exacta]

- Nunca omitas el TOTAL después de cada acción.

### 2. BÚSQUEDA Y SELECCIÓN (CONCISO)
- Al recibir resultados del catálogo, muestra SOLO:
**[Nombre]** → $[precio] | [2-3 ingredientes clave]
- Máximo 4 opciones. Sin explicaciones largas.
- Muestra siempre opciones del catálogo no las inventes.
- Cuando el usuario elija uno: confirma en 1 línea y actualiza el resumen con total.

### 3. PIZZAS MITAD Y MITAD (REGLA EXPLÍCITA)
- SOLO permitido si ambas mitades son del MISMO tamaño.
- Precio final = (precio_mitad1 + precio_mitad2) / 2 → redondea a 1 decimal.
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

const KEYWORD_EXTRACTOR_PROMPT = `Eres un extractor de palabras clave para búsqueda de productos de pizzería.
Tu única tarea: extraer las palabras clave más relevantes de la consulta del usuario para buscar productos.

REGLAS:
1. Extrae SOLO palabras que el usuario quiere encontrar en su nueva búsqueda no porque las menciona y ya sino lo que solicita
2. Extrae SOLO palabras relacionadas con productos: nombres de pizzas, ingredientes, tamaños, tipos de bebidas, postres
3. Ignora palabras como: quiero, busco, para, con, sin, también, además, me gustaría, etc.
4. Mantén plurales/singulares según el contexto
5. Si menciona tamaño (pequeña, mediana, grande, familiar), inclúyelo
6. Responde SOLO con las palabras clave separadas por espacios, sin explicaciones

EJEMPLOS:
Usuario: "quiero una pizza margarita mediana y una coca cola"
Respuesta: pizza margarita mediana coca cola

Usuario: "me gustaría ver las pizzas con jamón y champiñones"
Respuesta: pizza jamón champiñones

Usuario: "tienes postres?"
Respuesta: postres

Ahora extrae las palabras clave de esta consulta:`;

const CALCULATOR_PROMPT = `Eres una calculadora especializada en pedidos de pizzería.
Tu única tarea: calcular precios exactos basándote en el historial de conversación y los productos disponibles.

REGLAS PARA PIZZAS MITAD Y MITAD:
- Precio = (precio_mitad1 + precio_mitad2) / 2
- Redondea a 1 decimal
- SOLO permitido si ambos sabores tienen el MISMO tamaño
- Si no se especifica tamaño, NO lo calcules como mitad y mitad

FORMATO DE RESPUESTA (JSON obligatorio):
{
  "items": [
    {"producto": "nombre exacto", "cantidad": número, "precioUnitario": número, "subtotal": número}
  ],
  "total": número
}

IMPORTANTE:
- Suma SOLO el producto elegido por el usuario, no los productos disponibles sin seleccionar por el usuario.
- Al iniciar la conversación, el total es 0 y dejas items vacíos.
- Usa los precios EXACTOS que encuentres en los productos proporcionados
- Si un producto no tiene precio conocido, usa 0 y marca error: true
- Calcula subtotales: cantidad * precioUnitario
- Suma todos los subtotales para el total
- NO inventes precios

Responde SOLO el JSON, sin explicaciones adicionales.`;

// Generate embedding locally (runs on your machine, reaches localhost:7860)
async function generateEmbedding(text: string): Promise<number[]> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: [text],
          model: EMBEDDINGS_MODEL,
        }),
      });

      if (!response.ok) {
        const isRetryable =
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;
        if (attempt < maxRetries && isRetryable) {
          console.log(
            `Embedding API error ${response.status}, retrying (${attempt}/${maxRetries})...`
          );
          await new Promise((r) => setTimeout(r, baseDelay * attempt));
          continue;
        }
        throw new Error(
          `Embedding API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error: any) {
      if (
        attempt < maxRetries &&
        (error instanceof TypeError || error?.message?.includes("fetch"))
      ) {
        console.log(
          `Network error on embedding, retrying (${attempt}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, baseDelay * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached for embedding generation");
}

// Extract keywords from user query for cleaner search
async function extractKeywords(userQuery: string): Promise<string> {
  try {
    const prompt = `${KEYWORD_EXTRACTOR_PROMPT}\n\nConsulta: "${userQuery}"\n\nPalabras clave:`;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("Keyword extraction failed, using original query");
      return userQuery;
    }

    const data = await response.json();
    const keywords = data.response?.trim() || userQuery;
    console.log(`[Keyword Extraction] Original: "${userQuery}" → Keywords: "${keywords}"`);
    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return userQuery; // Fallback to original query
  }
}

// Calculate prices and totals using Ollama
async function calculatePrices(
  products: any[],
  conversationHistory: string
): Promise<{ items: any[]; total: number; error?: boolean }> {
  try {
    const productsInfo = products
      .map(
        (p) =>
          `- ${p.name} (${p.size || "N/A"}): $${p.price || 0} | Stock: ${p.quantity || 0}`
      )
      .join("\n");

    const prompt = `${CALCULATOR_PROMPT}

PRODUCTOS DISPONIBLES:
${productsInfo}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory}

Analiza el historial y calcula el pedido actual en formato JSON:`;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("Price calculation failed");
      return { items: [], total: 0, error: true };
    }
    
    
    const data = await response.json();
    const responseText = data.response?.trim() || "{}";
    
    // Extract JSON from response (might have markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else if (responseText.includes("{") && responseText.includes("}")) {
      const start = responseText.indexOf("{");
      const end = responseText.lastIndexOf("}") + 1;
      jsonText = responseText.substring(start, end);
    }

    const calculation = JSON.parse(jsonText);
    console.log("[Price Calculator] Result:", calculation);
    return calculation;
  } catch (error) {
    console.error("Error calculating prices:", error);
    return { items: [], total: 0, error: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, threadId } = await request.json();

    if (!query || !threadId) {
      return NextResponse.json(
        { error: "Missing query or threadId" },
        { status: 400 }
      );
    }

    // 1. Save user message in Convex
    await convex.mutation(api.agents.pizzaAgent.saveMessage, {
      threadId,
      role: "user",
      content: query,
    });

    // 2. Extract keywords for better search
    const keywords = await extractKeywords(query);

    // 3. Generate embedding locally using keywords (localhost:7860)
    let products: any[] = [];
    try {
      const embedding = await generateEmbedding(keywords);

      // 4. Vector search in Convex with the pre-computed embedding
      products = await convex.action(
        api.rag.vectorSearch.searchByEmbedding,
        { embedding, limit: 8 }
      );
    } catch (e) {
      console.error("Embedding/search failed:", e);
    }

    // 5. Get conversation history from Convex
    const history = await convex.query(api.agents.pizzaAgent.getMessages, {
      threadId,
    });

    // 6. Calculate prices and totals
    let calculation: { items: any[]; total: number; error?: boolean } = { 
      items: [], 
      total: 0, 
      error: false 
    };
    if (products.length > 0 && (history as any[]).length > 0) {
      const historyText = (history as any[])
        .map(msg => `${msg.role === "user" ? "CLIENTE" : "ASISTENTE"}: ${msg.content}`)
        .join("\n");
      calculation = await calculatePrices(products, historyText);
    }

    // 7. Build concatenated prompt with full context (for /generate endpoint)
    let fullPrompt = `${SYSTEM_PROMPT}\n\n`;

    // Add conversation history (limit to last 20 messages)
    const recentHistory = (history as any[]).slice(-20);
    if (recentHistory.length > 0) {
      fullPrompt += "=== HISTORIAL DE CONVERSACIÓN ===\n";
      for (const msg of recentHistory) {
        const speaker = msg.role === "user" ? "CLIENTE" : "ASISTENTE";
        fullPrompt += `${speaker}: ${msg.content}\n\n`;
      }
      fullPrompt += "=== FIN HISTORIAL ===\n\n";
    }

    // Add product search results if available
    if (products.length > 0) {
      fullPrompt += "=== PRODUCTOS RELACIONADOS ENCONTRADOS EN CATÁLOGO ===\n";
      const productInfo = products
        .map(
          (p: any, i: number) =>
            `${i + 1}. "${p.name}" - $${p.price} | Categoría: ${p.category} | Tamaño: ${p.size || "N/A"} | Disponible: ${p.available ? "Sí" : "No"} | Stock: ${p.quantity} unidades | Ingredientes: ${p.ingredients.join(", ")} | Relevancia: ${((p.score || 0) * 100).toFixed(0)}%`
        )
        .join("\n");
    //   console.log("Productos encontrados para el prompt:\n" + productInfo);
        fullPrompt += productInfo + "\n\n";
      fullPrompt += "=== FIN CATÁLOGO ===\n\n";
    }

    // Add calculation results if available
    if (calculation.items.length > 0 && !calculation.error) {
      fullPrompt += "=== RESUMEN DE PEDIDO CALCULADO ===\n";
      fullPrompt += "Tu pedido actual:\n";
      for (const item of calculation.items) {
        fullPrompt += `• ${item.cantidad}x ${item.producto} → $${item.precioUnitario} c/u = $${item.subtotal}\n`;
      }
      fullPrompt += `\nTOTAL: $${calculation.total}\n`;
      fullPrompt += "=== FIN RESUMEN ===\n\n";
    }

    // Add current user query
    fullPrompt += `CLIENTE: ${query}\n\nASISTENTE:`;

    // 8. Call Ollama /generate endpoint with concatenated prompt
    let assistantResponse: string;
    try {
      const ollamaResponse = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1024,
            stop: ["CLIENTE:", "\n\nCLIENTE:"],
          },
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(
          `Ollama error: ${ollamaResponse.status} ${ollamaResponse.statusText}`
        );
      }

      const data = await ollamaResponse.json();
      assistantResponse =
        data.response?.trim() ||
        "Lo siento, no pude generar una respuesta.";
    } catch (error) {
      console.error("Ollama call failed:", error);
      assistantResponse =
        "⚠️ No pude conectar con el servicio de chat. Verifica que Ollama esté corriendo en localhost:11434.\n\n";

      // Fallback: show products if available
      if (products.length > 0) {
        assistantResponse +=
          "Mientras tanto, estos son los productos que encontré:\n\n";
        assistantResponse += products
          .map(
            (p: any, i: number) =>
              `${i + 1}. **${p.name}** - $${p.price}\n   ${p.description}\n   Stock: ${p.quantity} | ${p.available ? "✅ Disponible" : "❌ Agotado"}`
          )
          .join("\n\n");
      }
    }

    // 9. Save assistant response in Convex
    await convex.mutation(api.agents.pizzaAgent.saveMessage, {
      threadId,
      role: "assistant",
      content: assistantResponse,
    });

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error processing chat message" },
      { status: 500 }
    );
  }
}
