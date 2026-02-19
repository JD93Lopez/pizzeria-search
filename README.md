# Pizzería Search — Agente de Pedidos con Convex

Sistema de pedidos para pizzería usando **@convex-dev/agent** y **@convex-dev/rag** como componentes oficiales de Convex.

---

## Características

- 🤖 Agente conversacional con **tool calling real** — el LLM decide cuándo buscar en el catálogo
- 🔍 Búsqueda semántica RAG sobre **518 productos** (pizzas, bebidas, postres, platos)
- 🍕 Soporte de pizzas **mitad y mitad** con reglas de precio e inventario
- 📦 Control de inventario en tiempo real (full y half-deduction)
- ⚡ Reactividad automática con Convex `useQuery`

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Backend | [Convex](https://convex.dev) — serverless TypeScript |
| Agente | [@convex-dev/agent](https://www.npmjs.com/package/@convex-dev/agent) — threads, steps, tool calling |
| RAG | [@convex-dev/rag](https://www.npmjs.com/package/@convex-dev/rag) — embeddings + vector search |
| LLM | [OpenRouter](https://openrouter.ai) — aurora-alpha vía @ai-sdk/openai-compatible |
| Embeddings | Servidor local `multilingual-e5-large` (1024 dims) |
| Frontend | [Next.js 14](https://nextjs.org) App Router + [Tailwind CSS](https://tailwindcss.com) |

---

## Estructura del proyecto

```
pizzeria-search/
├── app/                    # Next.js App Router (frontend)
│   ├── chat/               # Página del chat y componentes UI
│   └── api/                # Route handlers (chat, reindex)
├── convex/                 # Backend Convex (serverless)
│   ├── ai/                 # Agente, RAG, proveedor, actions
│   ├── shared/             # Validators compartidos
│   ├── schema.ts           # Definición de tablas
│   ├── orders.ts           # Mutations de pedidos con inventario
│   ├── products.ts         # Queries/mutations de productos
│   └── convex.config.ts    # Registro de componentes agent y rag
├── lib/                    # ConvexClientProvider
├── scripts/                # Utilidades (seed, reindex)
├── package.json            # Proyecto unificado (sin workspaces)
└── .env.local              # Variables de entorno
```

`convex/_generated/` es generado automáticamente por `npx convex dev` — no se commitea.

---

## Configuración

### Requisitos

- Node.js >= 18.x
- Cuenta gratuita en [Convex](https://dashboard.convex.dev)
- API key de [OpenRouter](https://openrouter.ai)
- Servidor de embeddings local lightweight embeddings con modelo `multilingual-e5-large`

### Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```bash
CONVEX_DEPLOYMENT=dev:tu-deployment-id    # generado por npx convex dev
NEXT_PUBLIC_CONVEX_URL=https://tu-deployment.convex.cloud

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/aurora-alpha  # opcional

EMBEDDINGS_URL=http://localhost:11434/v1  # URL del servidor de embeddings
EMBEDDINGS_MODEL=multilingual-e5-large    # opcional
```

### Instalación y ejecución

```bash
npm install
npm run dev   # lanza Convex dev watcher + Next.js en paralelo
```

Abre [http://localhost:3000/chat](http://localhost:3000/chat).

---

## Componentes de Convex utilizados

### @convex-dev/agent

```typescript
// convex/ai/agent.ts
export const pizzaAgent = new Agent(components.agent, {
  languageModel: openrouter.chatModel("openrouter/aurora-alpha"),
  instructions: SYSTEM_PROMPT,
  tools: { searchCatalog },  // el LLM decide cuándo invocar
  maxSteps: 10,
});
```

### @convex-dev/rag

```typescript
// convex/ai/ragSetup.ts
export const rag = new RAG(components.rag, {
  textEmbeddingModel: createLocalEmbeddingModel({ ... }),
  embeddingDimension: 1024,
});

// convex/ai/agent.ts — tool searchCatalog
const { results } = await rag.search(ctx, {
  namespace: "products",
  query: args.query,
  limit: 8,
});
```

Embeddings y búsqueda vectorial son gestionados internamente por el componente RAG.

