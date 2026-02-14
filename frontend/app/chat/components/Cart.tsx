import { CartItem } from "@/lib/types";

interface CartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onPlaceOrder: () => void;
  isOrdering: boolean;
}

export function Cart({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onPlaceOrder,
  isOrdering,
}: CartProps) {
  if (items.length === 0) return null;

  const hasIncompleteHalves = items.some(
    (item) => item.type === "half" && !item.secondHalf
  );

  const total = items.reduce((sum, item) => {
    if (item.type === "full") {
      return sum + item.product.price * item.quantity;
    } else if (item.type === "half") {
      if (item.secondHalf) {
        // Half pizza = average of both halves' prices
        const halfPrice = (item.firstHalf.price + item.secondHalf.price) / 2;
        return sum + halfPrice * item.quantity;
      }
      return sum; // Incomplete half, don't count yet
    }
    return sum;
  }, 0);

  const completedItems = items.filter(
    (item) => item.type === "full" || (item.type === "half" && item.secondHalf)
  );

  const pendingHalf = items.find(
    (item) => item.type === "half" && !item.secondHalf
  );

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* Pending half notification */}
      {pendingHalf && pendingHalf.type === "half" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <p className="text-sm text-amber-700">
            🍕 <strong>Mitad pendiente:</strong> {pendingHalf.firstHalf.name} (
            {pendingHalf.size}) — Busca otro sabor para completar la pizza
          </p>
        </div>
      )}

      {/* Cart header */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          🛒 Carrito
          <span className="text-xs bg-pizza-red text-white px-2 py-0.5 rounded-full">
            {completedItems.length}
          </span>
        </h3>
      </div>

      {/* Cart items */}
      <div className="max-h-48 overflow-y-auto px-4 py-2 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-2 rounded-lg text-sm ${
              item.type === "half" && !item.secondHalf
                ? "bg-amber-50 border border-amber-200 border-dashed"
                : "bg-gray-50"
            }`}
          >
            <div className="flex-1">
              {item.type === "full" ? (
                <div>
                  <span className="font-medium">🍕 {item.product.name}</span>
                  {item.product.size && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({item.product.size})
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <span className="font-medium">
                    🍕 {item.firstHalf.flavors?.[0] || item.firstHalf.name}
                  </span>
                  {item.secondHalf ? (
                    <span className="font-medium">
                      {" "}
                      / {item.secondHalf.flavors?.[0] || item.secondHalf.name}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      {" "}
                      / <em>Esperando otra mitad...</em>
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-1">
                    ({item.size})
                  </span>
                </div>
              )}
            </div>

            {/* Price and controls */}
            <div className="flex items-center gap-2 ml-2">
              {/* Only show quantity controls for complete items */}
              {(item.type === "full" ||
                (item.type === "half" && item.secondHalf)) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onUpdateQuantity(
                        item.id,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-xs flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-xs flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Price */}
              <span className="font-semibold text-pizza-red min-w-[60px] text-right">
                {item.type === "full"
                  ? `$${(item.product.price * item.quantity).toFixed(2)}`
                  : item.type === "half" && item.secondHalf
                    ? `$${(((item.firstHalf.price + item.secondHalf.price) / 2) * item.quantity).toFixed(2)}`
                    : "—"}
              </span>

              {/* Remove button */}
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-gray-400 hover:text-red-500 text-xs ml-1"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">Total: </span>
          <span className="text-lg font-bold text-pizza-red">
            ${total.toFixed(2)}
          </span>
        </div>
        <button
          onClick={onPlaceOrder}
          disabled={
            completedItems.length === 0 || hasIncompleteHalves || isOrdering
          }
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isOrdering ? "Ordenando..." : "Hacer Pedido 📋"}
        </button>
      </div>
    </div>
  );
}
