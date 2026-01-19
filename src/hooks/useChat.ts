import { useState, useCallback, useRef } from "react";
import type { LoadingStatus, ChatMessage } from "@/lib/webllm-service";
import { webLLMService } from "@/lib/webllm-service";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    progress: 0,
    text: "",
    isLoading: false,
    isReady: false,
    error: null,
  });
  
  const abortRef = useRef(false);
  const currentResponseRef = useRef("");

  const initializeModel = useCallback(async (modelId?: string) => {
    try {
      await webLLMService.initialize(setLoadingStatus, modelId);
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isGenerating || !loadingStatus.isReady) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsGenerating(true);
    abortRef.current = false;
    currentResponseRef.current = "";

    try {
      await webLLMService.generateResponse(
        [...messages, userMessage],
        (token) => {
          if (abortRef.current) return;
          
          currentResponseRef.current += token;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content = currentResponseRef.current;
            }
            return newMessages;
          });
        },
        () => {
          setIsGenerating(false);
        }
      );
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.content = "Désolé, une erreur s'est produite lors de la génération de la réponse.";
        }
        return newMessages;
      });
      setIsGenerating(false);
    }
  }, [messages, isGenerating, loadingStatus.isReady]);

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    setIsGenerating(false);
  }, []);

  const clearChat = useCallback(async () => {
    setMessages([]);
    await webLLMService.resetChat();
  }, []);

  return {
    messages,
    isGenerating,
    loadingStatus,
    sendMessage,
    stopGeneration,
    clearChat,
    initializeModel,
  };
}
