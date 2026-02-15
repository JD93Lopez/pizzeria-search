# Pizzeria Search - Sistema de Búsqueda Inteligente

Sistema de búsqueda inteligente de productos de pizzería usando Convex con RAG y Agents.

## Video de Demostración del Chat

https://upbeduco-my.sharepoint.com/:v:/g/personal/juan_lopez_2022_upb_edu_co/IQBVM3NpQdzqT7jX4hQUg5EsAdYQ8Gxze245UZjFd0HZwGQ?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=tGXk7u

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
- **Embeddings**: Lightweight Embeddings API
- **Búsqueda**: Vector Search integrado
- **IA**: Convex Agents + RAG
- **IA Chat**: Openrouter Aurora Alpha

## Requisitos

- Node.js >= 18.x
- npm >= 9.x
- Cuenta en Convex (gratis)

## Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Convex
cd backend
npx convex dev

# 3. En otra terminal, iniciar frontend
cd frontend
npm run dev
```

## Uso

1. Abre http://localhost:3000
2. Haz clic en "Iniciar Chat"
3. Escribe tu pedido

## Tecnologías

- [Convex](https://convex.dev) - Backend reactivo
- [Next.js 14](https://nextjs.org) - Framework React
- [Tailwind CSS](https://tailwindcss.com) - Estilos
- [TypeScript](https://typescriptlang.org) - Tipado estático
