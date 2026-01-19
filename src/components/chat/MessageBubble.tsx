import type { ChatMessage } from "@/lib/webllm-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  isGenerating?: boolean;
}

export function MessageBubble({ message, isGenerating }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmptyAssistant = !isUser && message.content === "" && isGenerating;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-secondary")}>
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex flex-col max-w-[80%] md:max-w-[70%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {isEmptyAssistant ? (
            <div className="flex items-center gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse animation-delay-200">●</span>
              <span className="animate-pulse animation-delay-400">●</span>
            </div>
          ) : isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <div className="break-words">
              <MarkdownRenderer content={message.content} />
              {isGenerating && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse" />
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
