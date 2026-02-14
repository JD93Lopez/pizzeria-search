import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from backend
dotenv.config({ path: path.join(__dirname, "../backend/.env.local") });

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL no encontrada en backend/.env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Get startFrom from command line arguments
const args = process.argv.slice(2);
const startFromArg = args.find(arg => arg.startsWith('--start-from='));
const startFrom = startFromArg ? parseInt(startFromArg.split('=')[1]) : 0;

// Show usage if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📚 Uso del script de reindexación:
  
  npm run reindex-embeddings                    # Procesar todos los productos desde el inicio
  npm run reindex-embeddings -- --start-from=100   # Comenzar desde el producto #101
  
  Parámetros:
  --start-from=N    Comenzar desde el producto número N (0-based index)
  --help, -h        Mostrar esta ayuda
  `);
  process.exit(0);
}

async function reindexAllProducts() {
  console.log("🚀 Iniciando reindexación de productos...");
  console.log(`📡 Conectando a: ${CONVEX_URL}`);
  if (startFrom > 0) {
    console.log(`▶️  Comenzando desde el producto #${startFrom + 1}\n`);
  } else {
    console.log(`▶️  Procesando desde el primer producto\n`);
  }

  try {
    console.log("⏳ Procesando todos los productos (esto puede tardar varios minutos)...\n");
    
    const result = await client.action("rag/productIndexer:reindexAllProducts" as any, {
      startFrom: startFrom,
    });
    
    console.log(`✅ Reindexación completa!`);
    console.log(`📊 Total de productos indexados: ${result.indexed}/${result.total}`);
    console.log(`🚀 Comenzó desde el producto #${result.startedFrom + 1}\n`);
  } catch (error) {
    console.error("❌ Error durante la reindexación:", error);
    process.exit(1);
  }
}

reindexAllProducts()
  .then(() => {
    console.log("✨ Proceso completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
