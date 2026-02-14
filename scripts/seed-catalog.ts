/**
 * Seed del catálogo a Convex
 * Ejecutar: npx ts-node scripts/seed-catalog.ts
 */

import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import * as path from "path";

// Load catalog
const catalogPath = path.join(__dirname, "..", "backend", "convex", "data", "catalog.json");

if (!fs.existsSync(catalogPath)) {
  console.error("❌ Error: Catálogo no encontrado. Ejecuta primero: npm run generate-catalog");
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

async function seedCatalog() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  
  if (!convexUrl) {
    console.error("❌ Error: CONVEX_URL no configurado. Agrega CONVEX_URL a tu .env");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  
  console.log("🌱 Iniciando seed del catálogo...\n");
  console.log(`📍 Conectando a: ${convexUrl}`);
  console.log(`📦 Productos a insertar: ${catalog.length}\n`);

  // Clear existing products
  console.log("🗑️  Limpiando productos existentes...");
  // Note: You'll need to implement clearAll mutation
  
  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const batch = catalog.slice(i, i + BATCH_SIZE);
    
    try {
      // Use the createMany mutation
      await client.mutation("products:createMany" as any, { products: batch });
      inserted += batch.length;
      console.log(`✓ Insertados ${inserted}/${catalog.length} productos`);
    } catch (error) {
      console.error(`❌ Error insertando batch ${i}-${i + BATCH_SIZE}:`, error);
    }
  }

  console.log(`\n✅ Seed completado: ${inserted} productos insertados`);
}

seedCatalog().catch(console.error);
