import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Business rules for pizza ordering
const BUSINESS_RULES = {
  maxFlavorsPerPizza: {
    pequeña: 1,
    mediana: 2,
    grande: 2,
    familiar: 4,
  },
  comboPizzaSizes: ["mediana", "grande"],
  minimumOrderAmount: 50,
  maxItemsPerOrder: 20,
};

// Agent: Process user query and return products
export const processQuery = action({
  args: {
    query: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    // Save user message
    await ctx.runMutation(api.agents.pizzaAgent.saveMessage, {
      threadId: args.threadId,
      role: "user",
      content: args.query,
    });

    // Parse the query to understand intent
    const intent = parseIntent(args.query);

    let response: string;
    let products: any[] = [];

    if (intent.type === "search") {
      // Search for products using RAG
      products = await ctx.runAction(api.rag.vectorSearch.searchProducts, {
        query: intent.searchTerm,
        category: intent.category as any,
        limit: 10,
      });

      if (products.length === 0) {
        response = `No encontré productos que coincidan con "${intent.searchTerm}". ¿Puedo ayudarte con algo más?`;
      } else {
        response = formatProductResponse(products, intent);
      }
    } else if (intent.type === "pizza_combo") {
      // Handle pizza with multiple flavors
      const flavors = intent.flavors || [];
      const size = intent.size || "grande";

      // Validate business rules
      const maxFlavors =
        BUSINESS_RULES.maxFlavorsPerPizza[
          size as keyof typeof BUSINESS_RULES.maxFlavorsPerPizza
        ] || 2;

      if (flavors.length > maxFlavors) {
        response = `Una pizza ${size} permite máximo ${maxFlavors} sabores. Por favor, elige menos sabores.`;
      } else {
        // Search for each flavor
        const flavorProducts = await Promise.all(
          flavors.map((flavor) =>
            ctx.runAction(api.rag.vectorSearch.searchProducts, {
              query: `pizza ${flavor}`,
              category: "pizza",
              limit: 1,
            })
          )
        );

        products = flavorProducts.flat().filter((p) => p !== null);

        if (products.length < flavors.length) {
          const foundFlavors = products.map((p) => p.name).join(", ");
          response = `Encontré: ${foundFlavors}. Algunos sabores no están disponibles. ¿Deseas continuar con los disponibles?`;
        } else {
          response = `¡Perfecto! Para tu pizza ${size} de ${flavors.length} sabores encontré:\n${formatProductList(products)}`;
        }
      }
    } else if (intent.type === "help") {
      response = `¡Hola! Soy el asistente de la pizzería. Puedo ayudarte a:
- Buscar pizzas, bebidas, postres o combos
- Armar pizzas con múltiples sabores
- Consultar precios y disponibilidad

Ejemplo: "Quiero una pizza grande de 2 sabores: hawaiana y pepperoni"`;
    } else {
      response =
        "No entendí tu solicitud. ¿Podrías ser más específico? Por ejemplo: 'Quiero una pizza grande de pepperoni'";
    }

    // Save assistant response
    await ctx.runMutation(api.agents.pizzaAgent.saveMessage, {
      threadId: args.threadId,
      role: "assistant",
      content: response,
    });

    return {
      response,
      products,
      intent,
    };
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

// Parse user intent from query
function parseIntent(query: string): {
  type: "search" | "pizza_combo" | "help" | "unknown";
  searchTerm: string;
  category?: string;
  size?: string;
  flavors?: string[];
} {
  const lowerQuery = query.toLowerCase();

  // Help intent
  if (
    lowerQuery.includes("ayuda") ||
    lowerQuery.includes("help") ||
    lowerQuery === "hola"
  ) {
    return { type: "help", searchTerm: "" };
  }

  // Pizza combo intent (multiple flavors)
  const comboPatterns = [
    /pizza\s+(pequeña|mediana|grande|familiar)?\s*de\s*(\d+)\s*sabores?/i,
    /(\d+)\s*sabores?.*pizza/i,
    /pizza.*mitad.*mitad/i,
  ];

  for (const pattern of comboPatterns) {
    const match = query.match(pattern);
    if (match) {
      // Extract flavors from the query
      const flavors = extractFlavors(query);
      const size = extractSize(query) || "grande";

      return {
        type: "pizza_combo",
        searchTerm: query,
        category: "pizza",
        size,
        flavors,
      };
    }
  }

  // Detect category
  let category: string | undefined;
  if (lowerQuery.includes("pizza")) category = "pizza";
  else if (
    lowerQuery.includes("bebida") ||
    lowerQuery.includes("refresco") ||
    lowerQuery.includes("agua")
  )
    category = "bebida";
  else if (
    lowerQuery.includes("postre") ||
    lowerQuery.includes("pastel") ||
    lowerQuery.includes("helado")
  )
    category = "postre";
  else if (lowerQuery.includes("combo") || lowerQuery.includes("promoción"))
    category = "combo";

  // General search
  return {
    type: "search",
    searchTerm: query,
    category,
    size: extractSize(query),
  };
}

function extractFlavors(query: string): string[] {
  const knownFlavors = [
    "pepperoni",
    "hawaiana",
    "mexicana",
    "suprema",
    "margarita",
    "vegetariana",
    "carnes frías",
    "bbq",
    "4 quesos",
    "cuatro quesos",
    "champiñones",
    "salchicha",
    "jamón",
    "tocino",
    "pollo",
    "carne molida",
    "chorizo",
  ];

  const lowerQuery = query.toLowerCase();
  return knownFlavors.filter((flavor) => lowerQuery.includes(flavor));
}

function extractSize(
  query: string
): "pequeña" | "mediana" | "grande" | "familiar" | undefined {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("familiar")) return "familiar";
  if (lowerQuery.includes("grande")) return "grande";
  if (lowerQuery.includes("mediana")) return "mediana";
  if (lowerQuery.includes("pequeña") || lowerQuery.includes("chica"))
    return "pequeña";
  return undefined;
}

function formatProductResponse(products: any[], intent: any): string {
  const category = intent.category || "productos";
  const header = `Encontré ${products.length} ${category}${products.length > 1 ? "s" : ""} para ti:\n\n`;
  return header + formatProductList(products);
}

function formatProductList(products: any[]): string {
  return products
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** - $${p.price}\n   ${p.description}\n   Ingredientes: ${p.ingredients.join(", ")}`
    )
    .join("\n\n");
}
