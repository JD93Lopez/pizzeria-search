# Pizzeria Search - Sistema de Búsqueda Inteligente

Sistema de búsqueda inteligente de productos de pizzería usando Convex con RAG y Agents.

## Características

- 🔍 Búsqueda semántica de productos usando RAG
- 🤖 Agente conversacional para interactuar con el catálogo
- 📦 Catálogo de +500 productos de pizzería
- 📋 Reglas de negocio configurables
- ⚡ Tiempo real automático con Convex

## Arquitectura

- **Backend**: Convex (TypeScript)
- **Frontend**: NextJS 14 (App Router)
- **Base de datos**: Convex Database
- **Búsqueda**: Vector Search integrado
- **IA**: Convex Agents + RAG

## Requisitos

- Node.js >= 18.x
- npm >= 9.x
- Cuenta en Convex (gratis)

## Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Convex (crear cuenta si no tienes)
cd backend
npx convex dev
# Esto te pedirá crear un proyecto en Convex

# 3. Copiar la URL de Convex a frontend/.env.local
# NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# 4. Generar catálogo de productos
npm run generate-catalog

# 5. En otra terminal, iniciar frontend
cd frontend
npm run dev
```

## Estructura del Proyecto

```
pizzeria-search/
├── backend/                    # Backend Convex
│   └── convex/
│       ├── agents/             # Agente de pizza (procesamiento NLP)
│       ├── rag/                # Vector search y indexación
│       ├── domain/             # Modelos de dominio
│       ├── application/        # Casos de uso
│       ├── schema.ts           # Esquema de base de datos
│       └── products.ts         # CRUD de productos
├── frontend/                   # Frontend NextJS
│   └── app/
│       ├── chat/               # Interfaz de chat
│       └── page.tsx            # Landing page
└── scripts/                    # Generador de catálogo
```

## Uso

1. Abre http://localhost:3000
2. Haz clic en "Iniciar Chat"
3. Escribe tu pedido, por ejemplo:
   - "Quiero una pizza grande de pepperoni"
   - "Pizza grande de 2 sabores: hawaiana y mexicana"
   - "¿Qué bebidas tienen?"
   - "Dame un combo familiar"

## Reglas de Negocio

- Pizza pequeña: 1 sabor máximo
- Pizza mediana: 2 sabores máximo
- Pizza grande: 2 sabores máximo
- Pizza familiar: 4 sabores máximo

## Tecnologías

- [Convex](https://convex.dev) - Backend reactivo
- [Next.js 14](https://nextjs.org) - Framework React
- [Tailwind CSS](https://tailwindcss.com) - Estilos
- [TypeScript](https://typescriptlang.org) - Tipado estático
