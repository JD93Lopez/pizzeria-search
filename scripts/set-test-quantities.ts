/**
 * Script para establecer quantity = 2 en todos los productos para pruebas
 * Ejecutar: npx ts-node scripts/set-test-quantities.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { ConvexHttpClient } from "convex/browser";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

async function setTestQuantities() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  
  if (!convexUrl) {
    console.error("❌ Error: CONVEX_URL no configurado. Agrega CONVEX_URL a tu .env");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);
  
  console.log("🔄 Estableciendo quantity = 2 para todos los productos...\n");
  console.log(`📍 Conectando a: ${convexUrl}`);

  try {
    const result = await client.mutation("products:setAllQuantities" as any, { 
      quantity: 2 
    });
    
    console.log(`✅ ¡Completado!`);
    console.log(`📦 Productos actualizados: ${result.updated}/${result.totalProducts}`);
    console.log(`🛒 Todos los productos ahora tienen quantity = 2 y available = true`);
    
  } catch (error) {
    console.error("❌ Error al actualizar productos:", error);
    process.exit(1);
  }
}

// Ejecutar el script
setTestQuantities().catch(console.error);