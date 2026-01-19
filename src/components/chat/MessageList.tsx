import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/webllm-service";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
}

export function MessageList({ messages, isGenerating }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bot className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-2">Bienvenue !</h3>
        <p className="text-center text-sm max-w-md">
          Je suis un assistant IA qui fonctionne entièrement dans votre navigateur.
          Posez-moi une question en français !
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="bg-muted rounded-lg p-3 text-center">
            "Explique-moi la photosynthèse"
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            "Écris un haiku sur la mer"
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            "Qu'est-ce que l'intelligence artificielle ?"
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            "Donne-moi une recette simple"
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="py-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isGenerating={isGenerating && index === messages.length - 1 && message.role === "assistant"}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
