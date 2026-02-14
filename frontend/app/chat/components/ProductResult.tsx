import { Product } from "@/lib/types";

interface ProductResultProps {
  product: Product;
}

export function ProductResult({ product }: ProductResultProps) {
  const categoryEmoji = {
    pizza: "🍕",
    bebida: "🥤",
    postre: "🍰",
    combo: "🎁",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">
              {categoryEmoji[product.category] || "📦"}
            </span>
            <h4 className="font-semibold text-gray-800">{product.name}</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">{product.description}</p>

          {product.size && (
            <span className="inline-block bg-pizza-cream text-pizza-orange text-xs px-2 py-1 rounded-full mr-2">
              {product.size}
            </span>
          )}

          {product.ingredients.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium">Ingredientes:</span>{" "}
              {product.ingredients.slice(0, 4).join(", ")}
              {product.ingredients.length > 4 && "..."}
            </p>
          )}
        </div>

        <div className="text-right ml-4">
          <p className="text-xl font-bold text-pizza-red">
            ${product.price.toFixed(2)}
          </p>
          {product.available ? (
            <span className="text-xs text-green-600">✓ Disponible</span>
          ) : (
            <span className="text-xs text-red-600">✗ Agotado</span>
          )}
        </div>
      </div>

      {product.score !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Relevancia: {(product.score * 100).toFixed(0)}%
            </span>
            <button className="text-sm text-pizza-red hover:text-pizza-orange font-medium">
              Agregar +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
