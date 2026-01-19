import { useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ModelLoader } from "./ModelLoader";

export function ChatContainer() {
  const {
    messages,
    isGenerating,
    loadingStatus,
    sendMessage,
    stopGeneration,
    clearChat,
    initializeModel,
  } = useChat();

  const handleLoadModel = useCallback((modelId: string) => {
    initializeModel(modelId);
  }, [initializeModel]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <ModelLoader status={loadingStatus} onLoad={handleLoadModel} />
      
      <ChatHeader 
        onClear={clearChat} 
        messagesCount={messages.length}
        modelId={loadingStatus.modelId}
      />
      
      <MessageList messages={messages} isGenerating={isGenerating} />
      
      <ChatInput
        onSend={sendMessage}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        isReady={loadingStatus.isReady}
      />
      
      {/* Footer avec disclaimer et copyleft */}
      <footer className="text-center text-xs text-muted-foreground py-2 px-4 border-t bg-background/50">
        <p className="mb-1">
          ⚠️ Les réponses sont générées par une IA et peuvent contenir des erreurs. 
          Aucune garantie n'est fournie. Utilisez à vos risques.
        </p>
        <p>
          © 2026 Pierre Jourlin — <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Licence Apache 2.0</a>
        </p>
      </footer>
    </div>
  );
}
