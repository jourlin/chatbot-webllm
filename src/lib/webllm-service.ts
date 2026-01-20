import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

export type LoadingStatus = {
  progress: number;
  text: string;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  modelId?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Modèles disponibles par ordre de puissance
// On utilise q4f32 (float32) au lieu de q4f16 pour compatibilité avec GPU Intel/AMD intégrés
export const AVAILABLE_MODELS = {
  // Ultra-léger - fallback WASM/CPU (SwiftShader) - très lent mais fonctionne partout
  wasm_tiny: "SmolLM2-135M-Instruct-q0f32-MLC",
  // Très léger - pour GPU très limités (f32 pour compatibilité)
  tiny: "SmolLM2-135M-Instruct-q0f32-MLC",
  // Léger - pour GPU intégrés (Intel, AMD APU)
  small: "SmolLM2-360M-Instruct-q4f32_1-MLC",
  // Moyen - pour GPU dédiés entrée de gamme (f16 pour performance)
  medium: "Qwen3-0.6B-q4f16_1-MLC",
  // Standard - pour GPU dédiés milieu de gamme
  large: "Qwen3-1.7B-q4f16_1-MLC",
  // Puissant - pour GPU dédiés haut de gamme (RTX 3060+, ~5 Go VRAM)
  xlarge: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
  // Très puissant - pour GPU haut de gamme (RTX 3080+, RTX 4070+, ~6-8 Go VRAM)
  xxlarge: "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC",
  // Versions f32 pour GPU sans support f16
  medium_f32: "Qwen3-0.6B-q4f32_1-MLC",
  large_f32: "Qwen3-1.7B-q4f32_1-MLC",
  xlarge_f32: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  xxlarge_f32: "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
} as const;

export type ModelTier = keyof typeof AVAILABLE_MODELS;

class WebLLMService {
  private engine: MLCEngine | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private currentModelId: string | null = null;
  
  async initialize(
    onProgress: (status: LoadingStatus) => void,
    modelId?: string
  ): Promise<void> {
    const targetModel = modelId || AVAILABLE_MODELS.small;
    
    if (this.engine && this.currentModelId === targetModel) {
      onProgress({
        progress: 100,
        text: "Modèle déjà chargé",
        isLoading: false,
        isReady: true,
        error: null,
        modelId: targetModel,
      });
      return;
    }

    // Si on change de modèle, reset l'engine
    if (this.engine && this.currentModelId !== targetModel) {
      this.engine = null;
      this.currentModelId = null;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    this.initPromise = (async () => {
      try {
        onProgress({
          progress: 0,
          text: `Initialisation de ${targetModel.split("-q")[0]}...`,
          isLoading: true,
          isReady: false,
          error: null,
          modelId: targetModel,
        });

        this.engine = await CreateMLCEngine(targetModel, {
          initProgressCallback: (report) => {
            onProgress({
              progress: Math.round(report.progress * 100),
              text: report.text,
              isLoading: true,
              isReady: false,
              error: null,
              modelId: targetModel,
            });
          },
        });

        this.currentModelId = targetModel;

        onProgress({
          progress: 100,
          text: "Modèle prêt !",
          isLoading: false,
          isReady: true,
          error: null,
          modelId: targetModel,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        onProgress({
          progress: 0,
          text: errorMessage,
          isLoading: false,
          isReady: false,
          error: errorMessage,
        });
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  async generateResponse(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    onComplete: () => void
  ): Promise<void> {
    if (!this.engine) {
      throw new Error("Le modèle n'est pas initialisé");
    }

    const chatMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Tu es un assistant IA utile, amical et concis. Tu réponds toujours en français. Tu fournis des réponses claires et bien structurées.`,
      },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    try {
      const stream = await this.engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onToken(content);
        }
      }
      
      onComplete();
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      throw error;
    }
  }

  async resetChat(): Promise<void> {
    if (this.engine) {
      await this.engine.resetChat();
    }
  }

  isReady(): boolean {
    return this.engine !== null;
  }
}

// Singleton pour le service WebLLM
export const webLLMService = new WebLLMService();
