import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-pizza-red mb-4">
          🍕 Pizzeria Search
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Tu asistente inteligente para encontrar los mejores productos de
          nuestra pizzería
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <span className="text-3xl mb-2 block">🔍</span>
            <h3 className="font-semibold text-lg mb-2">Búsqueda Inteligente</h3>
            <p className="text-gray-600 text-sm">
              Encuentra productos usando lenguaje natural
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <span className="text-3xl mb-2 block">🍕</span>
            <h3 className="font-semibold text-lg mb-2">Pizzas Personalizadas</h3>
            <p className="text-gray-600 text-sm">
              Arma tu pizza con múltiples sabores
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <span className="text-3xl mb-2 block">💬</span>
            <h3 className="font-semibold text-lg mb-2">Chat Conversacional</h3>
            <p className="text-gray-600 text-sm">
              Habla con nuestro agente como si fuera un mesero
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <span className="text-3xl mb-2 block">⚡</span>
            <h3 className="font-semibold text-lg mb-2">Tiempo Real</h3>
            <p className="text-gray-600 text-sm">
              Respuestas instantáneas con tecnología Convex
            </p>
          </div>
        </div>

        <Link
          href="/chat"
          className="inline-block bg-pizza-red hover:bg-pizza-orange text-white font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-lg"
        >
          Iniciar Chat 💬
        </Link>
      </div>
    </main>
  );
}
