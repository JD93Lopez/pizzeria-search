import { Product } from "@/lib/types";

interface ProductResultProps {
  product: Product;
  onAddFull?: (product: Product) => void;
  onAddHalf?: (product: Product) => void;
  hasPendingHalf?: boolean;
  pendingHalfSize?: string;
}

export function ProductResult({
  product,
  onAddFull,
  onAddHalf,
  hasPendingHalf,
  pendingHalfSize,
}: ProductResultProps) {
  const categoryEmoji: Record<string, string> = {
    pizza: "🍕",
    bebida: "🥤",
    postre: "🍰",
    plato: "🍝",
  };

  const isPizza = product.category === "pizza";
  const canAddAsHalf =
    isPizza &&
    (!hasPendingHalf || (hasPendingHalf && pendingHalfSize === product.size));
  const isHalfSizeMismatch =
    isPizza && hasPendingHalf && pendingHalfSize !== product.size;

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

      {/* Action buttons */}
      {product.available && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {product.score !== undefined && (
            <span className="text-xs text-gray-400 block mb-2">
              Relevancia: {(product.score * 100).toFixed(0)}%
            </span>
          )}

          <div className="flex gap-2">
            {/* Full pizza / regular item button */}
            <button
              onClick={() => onAddFull?.(product)}
              className="flex-1 text-sm bg-pizza-red hover:bg-pizza-orange text-white py-1.5 px-3 rounded-full font-medium transition-colors"
            >
              {isPizza ? "Pizza Completa +" : "Agregar +"}
            </button>

            {/* Half pizza button (only for pizzas) */}
            {isPizza && (
              <button
                onClick={() => onAddHalf?.(product)}
                disabled={!canAddAsHalf || isHalfSizeMismatch}
                className={`flex-1 text-sm py-1.5 px-3 rounded-full font-medium transition-colors ${
                  canAddAsHalf && !isHalfSizeMismatch
                    ? hasPendingHalf
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                title={
                  isHalfSizeMismatch
                    ? `La mitad pendiente es ${pendingHalfSize}, esta pizza es ${product.size}`
                    : ""
                }
              >
                {hasPendingHalf && canAddAsHalf
                  ? "Completar Mitad ✓"
                  : "½ Mitad"}
              </button>
            )}
          </div>

          {/* Size mismatch warning */}
          {isHalfSizeMismatch && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ Tamaño diferente a la mitad pendiente ({pendingHalfSize})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
