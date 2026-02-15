/**
 * Generador de catálogo de pizzería con +500 productos
 * Ejecutar: npx ts-node scripts/generate-catalog.ts
 */

import * as fs from "fs";
import * as path from "path";

type Category = "pizza" | "bebida" | "postre" | "plato";
type Size = "pequeña" | "mediana" | "grande" | "familiar";

interface Product {
  name: string;
  description: string;
  category: Category;
  size?: Size;
  flavors?: string[];
  price: number;
  available: boolean;
  quantity: number; // Cantidad disponible en inventario
  ingredients: string[];
  tags: string[];
}

// Base data for generation - 40 pizza varieties
const PIZZA_BASES = [
  { name: "Pepperoni", ingredients: ["salsa de tomate", "queso mozzarella", "pepperoni"], tags: ["clásica", "carne", "popular"] },
  { name: "Hawaiana", ingredients: ["salsa de tomate", "queso mozzarella", "jamón", "piña"], tags: ["tropical", "dulce-salado", "popular"] },
  { name: "Mexicana", ingredients: ["salsa de tomate", "queso mozzarella", "chorizo", "jalapeño", "cebolla", "tomate"], tags: ["picante", "mexicana", "especial"] },
  { name: "Suprema", ingredients: ["salsa de tomate", "queso mozzarella", "pepperoni", "jamón", "champiñones", "pimiento", "cebolla"], tags: ["completa", "variada", "premium"] },
  { name: "Margarita", ingredients: ["salsa de tomate", "queso mozzarella", "albahaca fresca", "aceite de oliva"], tags: ["vegetariana", "clásica", "italiana"] },
  { name: "Vegetariana", ingredients: ["salsa de tomate", "queso mozzarella", "champiñones", "pimiento", "cebolla", "aceitunas", "tomate"], tags: ["vegetariana", "saludable"] },
  { name: "Carnes Frías", ingredients: ["salsa de tomate", "queso mozzarella", "jamón", "salami", "tocino"], tags: ["carne", "premium"] },
  { name: "BBQ Pollo", ingredients: ["salsa bbq", "queso mozzarella", "pollo", "cebolla caramelizada"], tags: ["bbq", "pollo", "especial"] },
  { name: "Cuatro Quesos", ingredients: ["salsa de tomate", "mozzarella", "parmesano", "gorgonzola", "provolone"], tags: ["quesos", "premium", "vegetariana"] },
  { name: "Champiñones", ingredients: ["salsa de tomate", "queso mozzarella", "champiñones", "ajo", "perejil"], tags: ["vegetariana", "hongos"] },
  { name: "Salchicha Italiana", ingredients: ["salsa de tomate", "queso mozzarella", "salchicha italiana", "pimiento"], tags: ["carne", "italiana"] },
  { name: "Tocino y Jalapeño", ingredients: ["salsa de tomate", "queso mozzarella", "tocino", "jalapeño"], tags: ["picante", "tocino", "especial"] },
  { name: "Pollo Ranch", ingredients: ["salsa ranch", "queso mozzarella", "pollo", "tocino", "cebolla"], tags: ["pollo", "ranch", "americana"] },
  { name: "Carne Molida", ingredients: ["salsa de tomate", "queso mozzarella", "carne molida", "cebolla"], tags: ["carne", "clásica"] },
  { name: "Chorizo", ingredients: ["salsa de tomate", "queso mozzarella", "chorizo", "cebolla", "jalapeño"], tags: ["mexicana", "picante", "carne"] },
  { name: "Buffalo Chicken", ingredients: ["salsa buffalo", "queso mozzarella", "pollo", "cebolla", "apio"], tags: ["picante", "pollo", "americana"] },
  { name: "Anchoas", ingredients: ["salsa de tomate", "queso mozzarella", "anchoas", "aceitunas", "alcaparras"], tags: ["mar", "italiana", "especial"] },
  { name: "Atún", ingredients: ["salsa de tomate", "queso mozzarella", "atún", "cebolla", "aceitunas"], tags: ["mar", "pescado"] },
  { name: "Caprichosa", ingredients: ["salsa de tomate", "queso mozzarella", "jamón", "alcachofas", "champiñones", "aceitunas"], tags: ["italiana", "variada"] },
  { name: "Diablo", ingredients: ["salsa de tomate", "queso mozzarella", "salami picante", "jalapeño", "chile habanero"], tags: ["muy picante", "extremo"] },
  { name: "Napolitana", ingredients: ["salsa de tomate", "queso mozzarella", "anchoas", "aceitunas negras", "orégano"], tags: ["italiana", "clásica"] },
  { name: "Prosciutto", ingredients: ["salsa de tomate", "queso mozzarella", "jamón serrano", "rúcula", "parmesano"], tags: ["premium", "italiana", "gourmet"] },
  { name: "Carbonara", ingredients: ["crema", "queso mozzarella", "tocino", "huevo", "pimienta negra"], tags: ["cremosa", "italiana", "especial"] },
  { name: "Funghi", ingredients: ["salsa de tomate", "queso mozzarella", "champiñones variados", "trufa"], tags: ["vegetariana", "premium", "hongos"] },
  { name: "Calzone", ingredients: ["salsa de tomate", "queso mozzarella", "jamón", "ricotta"], tags: ["especial", "italiana", "cerrada"] },
  { name: "Siciliana", ingredients: ["salsa de tomate", "queso mozzarella", "anchoas", "alcaparras", "aceitunas"], tags: ["italiana", "sicilia", "mar"] },
  { name: "Quattro Stagioni", ingredients: ["salsa de tomate", "queso mozzarella", "jamón", "champiñones", "alcachofas", "aceitunas"], tags: ["italiana", "clásica", "variada"] },
  { name: "Americana", ingredients: ["salsa de tomate", "queso mozzarella", "salchicha", "papas fritas", "mostaza"], tags: ["americana", "especial"] },
  { name: "Tex-Mex", ingredients: ["salsa de tomate", "queso cheddar", "carne molida", "frijoles", "jalapeño", "crema agria"], tags: ["mexicana", "texana", "picante"] },
  { name: "Pollo Pesto", ingredients: ["salsa pesto", "queso mozzarella", "pollo", "tomates cherry", "piñones"], tags: ["pollo", "pesto", "gourmet"] },
  { name: "Mediterránea", ingredients: ["salsa de tomate", "queso feta", "aceitunas", "tomates secos", "espinaca"], tags: ["mediterránea", "vegetariana", "saludable"] },
  { name: "Española", ingredients: ["salsa de tomate", "queso manchego", "chorizo español", "pimiento asado"], tags: ["española", "ibérica", "especial"] },
  { name: "Thai Chicken", ingredients: ["salsa de maní", "queso mozzarella", "pollo", "cilantro", "cacahuate"], tags: ["asiática", "pollo", "exótica"] },
  { name: "Camarones", ingredients: ["salsa blanca", "queso mozzarella", "camarones", "ajo", "perejil"], tags: ["mariscos", "premium", "mar"] },
  { name: "Triple Carne", ingredients: ["salsa de tomate", "queso mozzarella", "carne molida", "chorizo", "tocino"], tags: ["carne", "premium", "carnívora"] },
  { name: "Al Pastor", ingredients: ["salsa de tomate", "queso mozzarella", "carne al pastor", "piña", "cilantro"], tags: ["mexicana", "al pastor", "especial"] },
  { name: "Carnitas", ingredients: ["salsa verde", "queso oaxaca", "carnitas", "cebolla", "cilantro"], tags: ["mexicana", "carnitas", "tradicional"] },
  { name: "Birria", ingredients: ["consomé de birria", "queso mozzarella", "birria de res", "cebolla", "cilantro"], tags: ["mexicana", "birria", "tendencia"] },
  { name: "Arrachera", ingredients: ["salsa chimichurri", "queso mozzarella", "arrachera", "cebolla asada", "pimiento"], tags: ["premium", "carne", "argentina"] },
  { name: "Trufa Negra", ingredients: ["crema de trufa", "queso mozzarella", "champiñones", "trufa negra", "parmesano"], tags: ["gourmet", "premium", "trufa"] },
];

const SIZES: { size: Size; multiplier: number }[] = [
  { size: "pequeña", multiplier: 0.7 },
  { size: "mediana", multiplier: 1.0 },
  { size: "grande", multiplier: 1.3 },
  { size: "familiar", multiplier: 1.6 },
];

const BEBIDAS = [
  { name: "Coca-Cola", variants: ["original", "zero", "light"], price: 35, ingredients: ["agua carbonatada", "azúcar", "cafeína"], tags: ["refresco", "cola"] },
  { name: "Sprite", variants: ["original", "zero"], price: 35, ingredients: ["agua carbonatada", "azúcar", "limón"], tags: ["refresco", "lima-limón"] },
  { name: "Fanta", variants: ["naranja", "uva", "fresa"], price: 35, ingredients: ["agua carbonatada", "azúcar", "saborizante"], tags: ["refresco", "frutal"] },
  { name: "Agua Mineral", variants: ["natural", "con gas"], price: 25, ingredients: ["agua purificada"], tags: ["agua", "natural"] },
  { name: "Limonada", variants: ["natural", "con chía", "de fresa"], price: 40, ingredients: ["agua", "limón", "azúcar"], tags: ["natural", "refrescante"] },
  { name: "Horchata", variants: ["tradicional", "con vainilla"], price: 40, ingredients: ["arroz", "canela", "azúcar", "leche"], tags: ["mexicana", "tradicional"] },
  { name: "Jamaica", variants: ["natural", "con limón"], price: 38, ingredients: ["flor de jamaica", "agua", "azúcar"], tags: ["natural", "mexicana"] },
  { name: "Cerveza", variants: ["clara", "oscura", "artesanal"], price: 55, ingredients: ["cebada", "lúpulo", "agua"], tags: ["alcohol", "cerveza"] },
  { name: "Té Helado", variants: ["limón", "durazno", "natural"], price: 35, ingredients: ["té negro", "agua", "azúcar"], tags: ["té", "refrescante"] },
  { name: "Café", variants: ["americano", "cappuccino", "latte"], price: 45, ingredients: ["café", "agua", "leche"], tags: ["café", "caliente"] },
];

const POSTRES = [
  { name: "Brownie", description: "Brownie de chocolate con nueces", price: 55, ingredients: ["chocolate", "nuez", "harina", "huevo"], tags: ["chocolate", "nueces"] },
  { name: "Helado", variants: ["vainilla", "chocolate", "fresa", "napolitano"], price: 45, ingredients: ["leche", "crema", "azúcar"], tags: ["frío", "cremoso"] },
  { name: "Tiramisú", description: "Tiramisú italiano tradicional", price: 75, ingredients: ["mascarpone", "café", "bizcocho", "cacao"], tags: ["italiano", "café", "premium"] },
  { name: "Cheesecake", variants: ["New York", "frutos rojos", "oreo"], price: 65, ingredients: ["queso crema", "galleta", "huevo"], tags: ["cremoso", "premium"] },
  { name: "Canoli", description: "Canoli siciliano con ricotta", price: 55, ingredients: ["ricotta", "chocolate", "pistacho"], tags: ["italiano", "tradicional"] },
  { name: "Churros", variants: ["con chocolate", "con cajeta", "naturales"], price: 50, ingredients: ["harina", "azúcar", "canela"], tags: ["mexicano", "dulce"] },
  { name: "Pastel de Chocolate", description: "Rebanada de pastel triple chocolate", price: 70, ingredients: ["chocolate", "harina", "huevo", "crema"], tags: ["chocolate", "indulgente"] },
  { name: "Flan Napolitano", description: "Flan casero con caramelo", price: 50, ingredients: ["huevo", "leche", "azúcar", "vainilla"], tags: ["mexicano", "tradicional"] },
];

const COMBO_TEMPLATES = [
  { name: "Combo Individual", pizzaSize: "mediana", drinks: 1, dessert: false, discount: 0.10 },
  { name: "Combo Pareja", pizzaSize: "grande", drinks: 2, dessert: true, discount: 0.15 },
  { name: "Combo Familiar", pizzaSize: "familiar", drinks: 4, dessert: true, discount: 0.20 },
  { name: "Combo Amigos", pizzaSize: "grande", drinks: 4, dessert: false, discount: 0.12 },
  { name: "Combo Fiesta", pizzaSize: "familiar", drinks: 6, dessert: true, discount: 0.25 },
  { name: "Combo Ejecutivo", pizzaSize: "mediana", drinks: 1, dessert: true, discount: 0.08 },
  { name: "Combo 2x1", pizzaSize: "grande", drinks: 2, dessert: false, discount: 0.30 },
  { name: "Combo Kids", pizzaSize: "pequeña", drinks: 1, dessert: true, discount: 0.15 },
];

function generatePizzas(): Product[] {
  const pizzas: Product[] = [];
  const basePrice = 120;

  // Single flavor pizzas (40 bases x 4 sizes = 160 products)
  for (const base of PIZZA_BASES) {
    for (const sizeInfo of SIZES) {
      const price = Math.round(basePrice * sizeInfo.multiplier);
      pizzas.push({
        name: `Pizza ${base.name} ${sizeInfo.size}`,
        description: `Deliciosa pizza ${base.name.toLowerCase()} tamaño ${sizeInfo.size} con ${base.ingredients.slice(0, 3).join(", ")}`,
        category: "pizza",
        size: sizeInfo.size,
        flavors: [base.name.toLowerCase()],
        price,
        available: Math.random() > 0.05,
        quantity: Math.floor(Math.random() * 20) + 5, // Entre 5 y 25 unidades
        ingredients: base.ingredients,
        tags: [...base.tags, sizeInfo.size],
      });
    }
  }

  // Multi-flavor pizzas (top 15 flavors combinations = 105 x 2 sizes = 210 products)
  const topFlavors = PIZZA_BASES.slice(0, 15).map(b => b.name);
  for (let i = 0; i < topFlavors.length; i++) {
    for (let j = i + 1; j < topFlavors.length; j++) {
      const flavor1 = topFlavors[i];
      const flavor2 = topFlavors[j];
      
      for (const sizeInfo of SIZES.filter(s => s.size === "grande" || s.size === "familiar")) {
        const base1 = PIZZA_BASES.find(b => b.name === flavor1)!;
        const base2 = PIZZA_BASES.find(b => b.name === flavor2)!;
        const price = Math.round(140 * sizeInfo.multiplier);

        pizzas.push({
          name: `Pizza Mitad ${flavor1} Mitad ${flavor2} ${sizeInfo.size}`,
          description: `Pizza ${sizeInfo.size} con dos sabores: mitad ${flavor1.toLowerCase()} y mitad ${flavor2.toLowerCase()}`,
          category: "pizza",
          size: sizeInfo.size,
          flavors: [flavor1.toLowerCase(), flavor2.toLowerCase()],
          price,
          available: Math.random() > 0.1,
          quantity: Math.floor(Math.random() * 15) + 3, // Entre 3 y 18 unidades
          ingredients: [...new Set([...base1.ingredients, ...base2.ingredients])],
          tags: ["dos sabores", "especial", sizeInfo.size],
        });
      }
    }
  }

  return pizzas;
}

function generateBebidas(): Product[] {
  const bebidas: Product[] = [];

  for (const bebida of BEBIDAS) {
    for (const variant of bebida.variants) {
      bebidas.push({
        name: `${bebida.name} ${variant}`,
        description: `${bebida.name} sabor ${variant}`,
        category: "bebida",
        price: bebida.price,
        available: Math.random() > 0.02,
        quantity: Math.floor(Math.random() * 50) + 20, // Entre 20 y 70 unidades
        ingredients: bebida.ingredients,
        tags: [...bebida.tags, variant],
      });

      // Add 2L sizes for sodas
      if (["Coca-Cola", "Sprite", "Fanta"].includes(bebida.name)) {
        bebidas.push({
          name: `${bebida.name} ${variant} 2L`,
          description: `${bebida.name} ${variant} tamaño familiar 2 litros`,
          category: "bebida",
          price: bebida.price + 25,
          available: Math.random() > 0.05,
          quantity: Math.floor(Math.random() * 30) + 10, // Entre 10 y 40 unidades
          ingredients: bebida.ingredients,
          tags: [...bebida.tags, variant, "familiar"],
        });
      }
    }
  }

  return bebidas;
}

function generatePostres(): Product[] {
  const postres: Product[] = [];

  for (const postre of POSTRES) {
    if ("variants" in postre && postre.variants) {
      for (const variant of postre.variants) {
        postres.push({
          name: `${postre.name} ${variant}`,
          description: `${postre.name} sabor ${variant}`,
          category: "postre",
          price: postre.price,
          available: Math.random() > 0.05,
          quantity: Math.floor(Math.random() * 20) + 5, // Entre 5 y 25 unidades
          ingredients: postre.ingredients,
          tags: [...postre.tags, variant],
        });
      }
    } else {
      postres.push({
        name: postre.name,
        description: postre.description,
        category: "postre",
        price: postre.price,
        available: Math.random() > 0.05,
        quantity: Math.floor(Math.random() * 25) + 8, // Entre 8 y 33 unidades
        ingredients: postre.ingredients,
        tags: postre.tags,
      });
    }
  }

  return postres;
}

function generateCombos(pizzas: Product[]): Product[] {
  const platos: Product[] = [];
  const pizzaNames = PIZZA_BASES.map(b => b.name);

  for (const template of COMBO_TEMPLATES) {
    for (const pizzaName of pizzaNames) {
      const pizza = pizzas.find(p => 
        p.name.includes(pizzaName) && 
        p.size === template.pizzaSize
      );
      
      if (!pizza) continue;

      const basePrice = pizza.price + (template.drinks * 30) + (template.dessert ? 45 : 0);
      const finalPrice = Math.round(basePrice * (1 - template.discount));

      platos.push({
        name: `${template.name} ${pizzaName}`,
        description: `${template.name}: Pizza ${pizzaName} ${template.pizzaSize} + ${template.drinks} bebidas${template.dessert ? " + postre" : ""}`,
        category: "plato",
        size: template.pizzaSize as Size,
        price: finalPrice,
        available: Math.random() > 0.05,
        quantity: Math.floor(Math.random() * 10) + 2, // Entre 2 y 12 unidades (menos stock para combos)
        ingredients: pizza.ingredients,
        tags: ["plato", "promoción", template.pizzaSize, pizzaName.toLowerCase()],
      });
    }
  }

  return platos;
}

function generateCatalog(): Product[] {
  console.log("🍕 Generando catálogo de pizzería...\n");

  const pizzas = generatePizzas();
  console.log(`✓ Pizzas generadas: ${pizzas.length}`);

  const bebidas = generateBebidas();
  console.log(`✓ Bebidas generadas: ${bebidas.length}`);

  const postres = generatePostres();
  console.log(`✓ Postres generados: ${postres.length}`);

  const platos = generateCombos(pizzas);
  console.log(`✓ Platos generados: ${platos.length}`);

  const catalog = [...pizzas, ...bebidas, ...postres, ...platos];
  console.log(`\n📦 Total de productos: ${catalog.length}`);

  return catalog;
}

// Main execution
const catalog = generateCatalog();

// Save to JSON file
const outputPath = path.join(__dirname, "..", "backend", "convex", "data", "catalog.json");
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), "utf-8");
console.log(`\n✅ Catálogo guardado en: ${outputPath}`);

// Print statistics
const stats = {
  total: catalog.length,
  byCategory: {
    pizza: catalog.filter(p => p.category === "pizza").length,
    bebida: catalog.filter(p => p.category === "bebida").length,
    postre: catalog.filter(p => p.category === "postre").length,
    plato: catalog.filter(p => p.category === "plato").length,
  },
  available: catalog.filter(p => p.available).length,
  priceRange: {
    min: Math.min(...catalog.map(p => p.price)),
    max: Math.max(...catalog.map(p => p.price)),
    avg: Math.round(catalog.reduce((sum, p) => sum + p.price, 0) / catalog.length),
  },
};

console.log("\n📊 Estadísticas del catálogo:");
console.log(JSON.stringify(stats, null, 2));

export { catalog, generateCatalog };
