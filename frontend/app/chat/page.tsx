"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Message } from "@/lib/types";
import { MessageBubble } from "./components/Message";
import { ProductResult } from "./components/ProductResult";
import { ChatInput } from "./components/ChatInput";
import { ErrorToast } from "./components/ErrorToast";

// Helper function for API calls with timeout and retry
const callWithRetry = async <T,>(
  apiCall: () => Promise<T>,
  timeoutMs: number = 2000,
  maxRetries: number = 3,
  onRetry?: (attempt: number) => void
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });
      
      const result = await Promise.race([apiCall(), timeoutPromise]);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isTimeout = error instanceof Error && error.message === 'Timeout';
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempt);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * attempt, 3000);
      console.log(`Intento ${attempt} falló, reintentando en ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries reached');
};

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  const createThread = useMutation(api.agents.pizzaAgent.createThread);
  const processQuery = useAction(api.agents.pizzaAgent.processQuery);
  const messages = useQuery(
    api.agents.pizzaAgent.getMessages,
    threadId ? { threadId } : "skip"
  );

  useEffect(() => {
    const initThread = async () => {
      const id = await createThread();
      setThreadId(id);
    };
    initThread();
  }, [createThread]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setRetryAttempt(0);
    setError(null);

    try {
      // Use timeout and retry logic
      const result = await callWithRetry(
        () => processQuery({ query: userMessage, threadId }),
        2000, // 2 second timeout
        3,    // 3 retry attempts
        (attempt) => setRetryAttempt(attempt) // Update retry state
      );

      if (result.products.length > 0) {
        setProducts(result.products);
      }
    } catch (error) {
      console.error("Error processing query:", error);
      
      // Show user-friendly error message
      const isTimeout = error instanceof Error && error.message === 'Timeout';
      const errorMessage = isTimeout 
        ? 'El servidor está tardando en responder. Por favor, intenta de nuevo.'
        : 'Hubo un error procesando tu consulta. Por favor, intenta de nuevo.';
      
      setError(errorMessage);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
      setRetryAttempt(0);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-pizza-red text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">🍕 Pizzeria Chat</h1>
        <p className="text-center text-sm opacity-90">
          Tu asistente para pedidos
        </p>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        {(!messages || messages.length === 0) && (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">🍕</span>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              ¡Bienvenido a nuestra pizzería!
            </h2>
            <p className="text-gray-500 mb-4">
              Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Ver pizzas disponibles",
                "Pizza grande de 2 sabores",
                "Quiero una hawaiana",
                "¿Qué combos tienen?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="bg-white border border-pizza-orange text-pizza-orange px-3 py-1 rounded-full text-sm hover:bg-pizza-orange hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages?.map((message: Message) => (
          <MessageBubble key={message._id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                {retryAttempt > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    Reintentando... ({retryAttempt}/3)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product results */}
        {products.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              Productos encontrados:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductResult key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
      
      {/* Error Toast */}
      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
}
