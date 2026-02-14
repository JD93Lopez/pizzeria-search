interface OrderConfirmationProps {
  orderId: string;
  total: number;
  itemCount: number;
  onClose: () => void;
}

export function OrderConfirmation({
  orderId,
  total,
  itemCount,
  onClose,
}: OrderConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl text-center">
        <span className="text-5xl block mb-3">✅</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          ¡Pedido Confirmado!
        </h2>
        <p className="text-gray-600 mb-4">
          Tu pedido de {itemCount} {itemCount === 1 ? "item" : "items"} ha sido
          registrado.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-pizza-red">
            ${total.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Orden: {orderId.slice(-8)}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-pizza-red hover:bg-pizza-orange text-white py-2.5 rounded-full font-medium transition-colors"
        >
          Seguir Comprando
        </button>
      </div>
    </div>
  );
}
