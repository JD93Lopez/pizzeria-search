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

## Arquitectura

```
monorepo/
├── backend/                 # Convex serverless backend
│   └── convex/
│       ├── convex.config.ts # Componentes: agent + rag
│       ├── schema.ts        # Schema de DB (products, orders)
│       ├── products.ts      # CRUD del catálogo
│       ├── orders.ts        # Órdenes con control de inventario
│       ├── ai/
│       │   ├── actions.ts   # API pública: startThread, sendMessage, getMessages, reindexProducts
│       │   ├── agent.ts     # Agent + tool searchCatalog
│       │   ├── prompts.ts   # System prompt del asistente
│       │   ├── provider.ts  # Providers: OpenRouter (LLM) + embedding local
│       │   └── ragSetup.ts  # Instancia RAG con embedding model
│       └── shared/
│           └── validators.ts # Validadores compartidos (categoryValidator, sizeValidator, etc.)
│
├── frontend/                # Next.js 14 (App Router)
│   └── app/
│       ├── chat/            # Página principal del chat
│       │   ├── page.tsx     # Chat UI con useQuery reactivo
│       │   └── components/  # MessageBubble, ChatInput, ErrorToast
│       └── api/
│           └── chat/route.ts # Next.js API route → llama a Convex action
│
└── tests/
    └── orders.test.ts       # Tests de reglas de negocio (20 casos con vitest)
```

### Stack técnico

| Capa | Tecnología |
|------|-----------|
| Backend | [Convex](https://convex.dev) — serverless TypeScript |
| Agente | [@convex-dev/agent](https://www.npmjs.com/package/@convex-dev/agent) — threads, steps, tool calling |
| RAG | [@convex-dev/rag](https://www.npmjs.com/package/@convex-dev/rag) — embeddings + vector search |
| LLM | [OpenRouter](https://openrouter.ai) — aurora-alpha via @ai-sdk/openai-compatible |
| Embeddings | Servidor local `multilingual-e5-large` (1024 dims) |
| Frontend | [Next.js 14](https://nextjs.org) App Router + [Tailwind CSS](https://tailwindcss.com) |
| Tests | [Vitest](https://vitest.dev) — 20 tests de lógica de negocio |

---

## Configuración

### Requisitos

- Node.js >= 18.x
- Cuenta gratuita en [Convex](https://dashboard.convex.dev)
- API key de [OpenRouter](https://openrouter.ai)
- Servidor de embeddings local (e.g. llama.cpp, Ollama, LM Studio con modelo `multilingual-e5-large`)

### Variables de entorno

**`backend/.env.local`**
```bash
CONVEX_DEPLOYMENT=dev:tu-deployment-id    # generado por npx convex dev
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/aurora-alpha  # opcional
EMBEDDINGS_URL=http://localhost:11434/v1  # URL del servidor de embeddings
EMBEDDINGS_MODEL=multilingual-e5-large    # opcional
```

**`frontend/.env.local`**
```bash
NEXT_PUBLIC_CONVEX_URL=https://tu-deployment.convex.cloud
```

### Instalación

```bash
# 1. Backend — iniciar Convex y desplegar funciones
cd backend
npm install
npx convex dev           # mantener corriendo en background

# 2. Indexar catálogo (en otra terminal, desde backend/)
npx convex run ai/actions:reindexProducts '{"startFrom":0,"limit":40}'
# Repetir con startFrom=40, 80, ... hasta done=true

# 3. Frontend
cd ../frontend
npm install
npm run dev              # http://localhost:3000
```

---

## Componentes de Convex utilizados

### @convex-dev/agent

```typescript
// backend/convex/ai/agent.ts
export const pizzaAgent = new Agent(components.agent, {
  languageModel: openrouter.chatModel("openrouter/aurora-alpha"),
  instructions: SYSTEM_PROMPT,
  tools: { searchCatalog },  // LLM decide cuándo invocar
  maxSteps: 10,
});
```

### @convex-dev/rag

```typescript
// backend/convex/ai/ragSetup.ts
export const rag = new RAG(components.rag, {
  textEmbeddingModel: createLocalEmbeddingModel({ ... }),
  embeddingDimension: 1024,
});

// El tool searchCatalog llama a rag.search() — sin SQL, sin vectorIndex manual
const { results } = await rag.search(ctx, { namespace: "products", query, limit: 8 });
```

---

## Tests

```bash
# Desde la raíz del monorepo
npm test
```

20 tests cubriendo:
- Precios mitad y mitad (max de los dos)
- Validación de tamaños iguales
- Deducción de stock (0.5 unidades por mitad)
- Restauración de stock al cancelar
- Totales de órdenes con múltiples items
- Casos borde (stock 0, cantidades negativas, pedidos grandes)

