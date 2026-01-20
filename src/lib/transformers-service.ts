import { pipeline, env } from "@huggingface/transformers";
import type { TextGenerationPipeline } from "@huggingface/transformers";

// Configurer transformers.js pour utiliser WASM/CPU
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
}

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

// Modèles compatibles avec transformers.js pour CPU (publics, sans authentification)
// Utiliser les modèles Xenova qui sont optimisés et testés pour transformers.js
export const AVAILABLE_CPU_MODELS = {
  // Phi-2 - petit modèle Microsoft très capable (2.7B mais quantifié)
  tiny: "Xenova/Phi-3-mini-4k-instruct",
  // Alternative plus légère
  small: "Xenova/Qwen1.5-0.5B-Chat",
} as const;

export type CPUModelTier = keyof typeof AVAILABLE_CPU_MODELS;

class TransformersService {
  private generator: TextGenerationPipeline | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private currentModelId: string | null = null;

  async initialize(
    onProgress: (status: LoadingStatus) => void,
    modelId?: string
  ): Promise<void> {
    const targetModel = modelId || AVAILABLE_CPU_MODELS.tiny;

    if (this.generator && this.currentModelId === targetModel) {
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

    // Si on change de modèle, reset
    if (this.generator && this.currentModelId !== targetModel) {
      this.generator = null;
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
          text: `Initialisation CPU/WASM de ${targetModel.split("/").pop()}...`,
          isLoading: true,
          isReady: false,
          error: null,
          modelId: targetModel,
        });

        // Créer le pipeline de génération de texte
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.generator = await (pipeline as any)("text-generation", targetModel, {
          dtype: "q4", // Quantization 4-bit pour réduire la taille
          device: "wasm", // Forcer WASM/CPU
          progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
            if (progress.status === "progress" && progress.progress !== undefined) {
              onProgress({
                progress: Math.round(progress.progress),
                text: `Téléchargement: ${progress.file || "modèle"}`,
                isLoading: true,
                isReady: false,
                error: null,
                modelId: targetModel,
              });
            } else if (progress.status === "ready") {
              onProgress({
                progress: 100,
                text: "Modèle prêt !",
                isLoading: false,
                isReady: true,
                error: null,
                modelId: targetModel,
              });
            }
          },
        });

        this.currentModelId = targetModel;

        onProgress({
          progress: 100,
          text: "Modèle CPU prêt !",
          isLoading: false,
          isReady: true,
          error: null,
          modelId: targetModel,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
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
    if (!this.generator) {
      throw new Error("Le modèle n'est pas initialisé");
    }

    // Construire le prompt au format ChatML (compatible Qwen1.5-Chat et autres)
    const systemPrompt = `Tu es un assistant IA serviable. Réponds toujours en français de manière claire et concise.`;
    
    // Format ChatML standard (compatible avec Qwen, Phi, etc.)
    let prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
    
    for (const msg of messages) {
      prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    }
    prompt += `<|im_start|>assistant\n`;

    try {
      // Générer la réponse avec des paramètres plus conservateurs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.generator as any)(prompt, {
        max_new_tokens: 150,
        temperature: 0.3, // Plus déterministe
        do_sample: true,
        top_k: 50,
        top_p: 0.9,
        repetition_penalty: 1.3,
        return_full_text: false,
      });

      // Extraire le texte généré
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let generatedText = "";
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0] as { generated_text?: string };
        generatedText = firstResult?.generated_text || "";
      } else if (result && typeof result === "object") {
        generatedText = (result as { generated_text?: string })?.generated_text || "";
      }
      
      // Nettoyer la réponse (enlever les tokens spéciaux restants)
      let assistantResponse = generatedText
        .split("<|im_end|>")[0] // Couper au premier token de fin
        .split("<|im_start|>")[0] // Couper si nouveau tour
        .replace(/<\|.*?\|>/g, "") // Enlever tous les tokens spéciaux restants
        .trim();
      
      // Si la réponse est vide ou incohérente, message d'erreur
      if (!assistantResponse || assistantResponse.length < 2) {
        assistantResponse = "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer.";
      }

      // Simuler le streaming en envoyant les tokens progressivement
      const words = assistantResponse.split(" ");
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? " " : "");
        onToken(word);
        // Petit délai pour simuler le streaming
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      onComplete();
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      throw error;
    }
  }

  async resetChat(): Promise<void> {
    // Pas de state de chat à reset dans transformers.js
  }

  isReady(): boolean {
    return this.generator !== null;
  }
}

// Singleton pour le service Transformers
export const transformersService = new TransformersService();
