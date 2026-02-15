"use client";

import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Message } from "@/lib/types";
import { MessageBubble } from "./components/Message";
import { ChatInput } from "./components/ChatInput";
import { ErrorToast } from "./components/ErrorToast";

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createThread = useMutation(api.agents.threadService.createThread);
  const messages = useQuery(
    api.agents.messageService.getMessages,
    threadId ? { threadId } : "skip"
  );

  useEffect(() => {
    const initThread = async () => {
      const id = await createThread();
      setThreadId(id);
    };
    initThread();
  }, [createThread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage, threadId }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Response is saved by the API route; Convex useQuery will pick it up reactively
      await response.json();
    } catch (err) {
      console.error("Error processing query:", err);
      setError(
        "Hubo un error procesando tu consulta. Verifica la conexión e intenta de nuevo."
      );
      setTimeout(() => setError(null), 7000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="bg-pizza-red text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">🍕 Pizzería Chat</h1>
        <p className="text-center text-sm opacity-90">
          Escríbeme lo que quieras pedir
        </p>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        {(!messages || messages.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍕</span>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              ¡Bienvenido a nuestra pizzería!
            </h2>
            <p className="text-gray-500 mb-6">
              Soy tu asistente virtual. Escríbeme lo que deseas ordenar.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "¿Qué pizzas tienen?",
                "Quiero una pizza hawaiana grande",
                "¿Tienen postres?",
                "Quiero una mitad pepperoni y mitad mexicana",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="bg-white border border-pizza-orange text-pizza-orange px-3 py-1.5 rounded-full text-sm hover:bg-pizza-orange hover:text-white transition-colors"
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
                <span className="text-xs text-gray-500 ml-2">
                  Pensando...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
        <ErrorToast message={error} onClose={() => setError(null)} />
      )}
    </div>
  );
}
