/** Message shape returned by the agent's getMessages query. */
interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

// Simple markdown-like rendering for bold, line breaks
function renderContent(text: string) {
  // Split by bold markers **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-pizza-red text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderContent(message.content)}
        </div>
        <span
          className={`text-xs mt-1 block ${
            isUser ? "text-white/70" : "text-gray-400"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
