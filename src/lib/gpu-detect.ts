// Types WebGPU
interface GPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

interface GPUSupportedLimits {
  maxBufferSize: number;
  maxComputeWorkgroupsPerDimension: number;
}

interface GPUAdapter {
  info: GPUAdapterInfo;
  limits: GPUSupportedLimits;
  features: Set<string>;
  isFallbackAdapter?: boolean;
}

interface GPU {
  requestAdapter(options?: { powerPreference?: string }): Promise<GPUAdapter | null>;
}

declare global {
  interface Navigator {
    gpu?: GPU;
  }
}

export interface GPUInfo {
  available: boolean;
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  isIntegrated: boolean;
  isFallback: boolean;
  isNvidia: boolean;
  isAMD: boolean;
  isIntel: boolean;
  isApple: boolean;
  // GPU mobiles
  isAdreno: boolean;  // Qualcomm (Android)
  isMali: boolean;    // ARM (Android)
  isPowerVR: boolean; // Imagination Technologies
  isMobile: boolean;  // Tout GPU mobile détecté
  // Détection software/émulation
  isSwiftShader: boolean;  // SwiftShader = émulation CPU (très lent)
  isOpenGLBackend: boolean; // Backend OpenGL au lieu de Vulkan natif
  supportsF16: boolean;
  limits: {
    maxBufferSize: number;
    maxComputeWorkgroupsPerDimension: number;
  } | null;
  error: string | null;
}

export interface AllGPUsInfo {
  preferredGPU: GPUInfo;
  allAdapters: GPUInfo[];
}

function getAdapterInfo(adapter: GPUAdapter): GPUInfo {
  // Utiliser adapter.info (propriété) au lieu de requestAdapterInfo() (méthode dépréciée)
  const info = adapter.info;
  const limits = adapter.limits;
  const features = adapter.features;

  const vendorLower = (info?.vendor || "").toLowerCase();
  const deviceLower = (info?.device || "").toLowerCase();
  const descLower = (info?.description || "").toLowerCase();
  const archLower = (info?.architecture || "").toLowerCase();
  
  const isNvidia = 
    vendorLower.includes("nvidia") ||
    descLower.includes("nvidia") ||
    descLower.includes("geforce") ||
    descLower.includes("rtx") ||
    descLower.includes("gtx");

  const isAMD = 
    vendorLower.includes("amd") ||
    vendorLower.includes("ati") ||
    descLower.includes("radeon") ||
    descLower.includes("amd");

  const isIntel = 
    vendorLower.includes("intel") ||
    descLower.includes("intel");

  // Détection Apple Silicon (M1, M2, M3, M4, etc.) et iPhone/iPad (A-series)
  const isApple = 
    vendorLower.includes("apple") ||
    descLower.includes("apple") ||
    archLower.includes("apple") ||
    // Les puces Apple M-series (Mac)
    archLower.includes("m1") ||
    archLower.includes("m2") ||
    archLower.includes("m3") ||
    archLower.includes("m4") ||
    // Les puces Apple A-series (iPhone/iPad)
    /a1[0-9]/.test(archLower) || // A10 à A19
    deviceLower.includes("apple") ||
    // Metal backend identifier
    descLower.includes("metal");

  // Détection GPU Qualcomm Adreno (Android haut de gamme)
  const isAdreno = 
    vendorLower.includes("qualcomm") ||
    descLower.includes("adreno") ||
    deviceLower.includes("adreno");

  // Détection GPU ARM Mali (Android milieu/entrée de gamme)
  const isMali = 
    vendorLower.includes("arm") ||
    descLower.includes("mali") ||
    deviceLower.includes("mali");

  // Détection GPU PowerVR (anciens iOS, certains Android)
  const isPowerVR = 
    vendorLower.includes("imagination") ||
    vendorLower.includes("powervr") ||
    descLower.includes("powervr") ||
    deviceLower.includes("powervr");

  // Flag global pour GPU mobile
  const isMobile = isAdreno || isMali || isPowerVR || 
    (isApple && (/a1[0-9]/.test(archLower) || descLower.includes("iphone") || descLower.includes("ipad")));

  // Détection SwiftShader (émulation CPU software - très lent)
  const isSwiftShader = 
    descLower.includes("swiftshader") ||
    deviceLower.includes("swiftshader") ||
    vendorLower.includes("google") && descLower.includes("subzero");

  // Détection backend OpenGL (moins performant que Vulkan natif)
  const isOpenGLBackend = 
    descLower.includes("opengl") ||
    descLower.includes("angle");

  const isIntegrated = 
    descLower.includes("integrated") ||
    deviceLower.includes("uhd") ||
    deviceLower.includes("iris") ||
    archLower.includes("gen") ||
    (isIntel && !descLower.includes("arc")) || // Intel Arc sont dédiés
    isApple; // Apple Silicon sont des SoC intégrés mais très performants

  // Vérifier le support de shader-f16 (float16)
  // Apple Silicon supporte généralement f16 via Metal
  const supportsF16 = features.has("shader-f16");

  let description = info?.description || "";
  if (!description) {
    description = [info?.vendor, info?.architecture, info?.device]
      .filter(Boolean)
      .join(" ") || "GPU inconnu";
  }

  return {
    available: true,
    vendor: info?.vendor || "Inconnu",
    architecture: info?.architecture || "Inconnu",
    device: info?.device || "Inconnu",
    description,
    isIntegrated,
    // SwiftShader est toujours considéré comme fallback (émulation CPU)
    isFallback: adapter.isFallbackAdapter || isSwiftShader,
    isNvidia,
    isAMD,
    isIntel,
    isApple,
    isAdreno,
    isMali,
    isPowerVR,
    isMobile,
    isSwiftShader,
    isOpenGLBackend,
    supportsF16,
    limits: {
      maxBufferSize: Number(limits.maxBufferSize),
      maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension,
    },
    error: null,
  };
}

export async function detectGPU(): Promise<GPUInfo> {
  const allGpus = await detectAllGPUs();
  return allGpus.preferredGPU;
}

export async function detectAllGPUs(): Promise<AllGPUsInfo> {
  const defaultError: GPUInfo = {
    available: false,
    vendor: "N/A",
    architecture: "N/A",
    device: "N/A",
    description: "WebGPU non supporté",
    isIntegrated: false,
    isFallback: false,
    isNvidia: false,
    isAMD: false,
    isIntel: false,
    isApple: false,
    isAdreno: false,
    isMali: false,
    isPowerVR: false,
    isMobile: false,
    isSwiftShader: false,
    isOpenGLBackend: false,
    supportsF16: false,
    limits: null,
    error: "WebGPU n'est pas disponible dans ce navigateur.",
  };

  if (!navigator.gpu) {
    return { preferredGPU: defaultError, allAdapters: [] };
  }

  try {
    const adapters: GPUInfo[] = [];

    // Essayer high-performance d'abord (GPU dédié)
    const highPerfAdapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    
    if (highPerfAdapter) {
      const info = getAdapterInfo(highPerfAdapter);
      adapters.push(info);
    }

    // Essayer low-power (GPU intégré)
    const lowPowerAdapter = await navigator.gpu.requestAdapter({
      powerPreference: "low-power",
    });
    
    if (lowPowerAdapter) {
      const info = getAdapterInfo(lowPowerAdapter);
      // Éviter les doublons
      const isDuplicate = adapters.some(
        a => a.description === info.description && a.vendor === info.vendor
      );
      if (!isDuplicate) {
        adapters.push(info);
      }
    }

    if (adapters.length === 0) {
      return { 
        preferredGPU: { ...defaultError, error: "Aucun GPU compatible trouvé" }, 
        allAdapters: [] 
      };
    }

    // Choisir le meilleur GPU : préférer dédié (Nvidia/AMD/Apple) sur intégré Intel
    // Sur mobile, il n'y a généralement qu'un seul GPU
    const preferredGPU = adapters.reduce((best, current) => {
      // Préférer GPU non-fallback
      if (current.isFallback && !best.isFallback) return best;
      if (!current.isFallback && best.isFallback) return current;
      
      // Apple Silicon est très performant malgré être "intégré"
      if (current.isApple && !best.isApple) return current;
      if (!current.isApple && best.isApple) return best;
      
      // GPU mobiles : Adreno > Mali > PowerVR généralement
      if (current.isMobile && best.isMobile) {
        if (current.isAdreno && !best.isAdreno) return current;
        if (!current.isAdreno && best.isAdreno) return best;
      }
      
      // Préférer GPU dédié (Nvidia ou AMD dédié) sur desktop
      if (!current.isIntegrated && best.isIntegrated && !best.isMobile) return current;
      if (current.isIntegrated && !best.isIntegrated && !current.isMobile) return best;
      
      // Entre deux GPU dédiés, préférer Nvidia
      if (current.isNvidia && !best.isNvidia) return current;
      if (!current.isNvidia && best.isNvidia) return best;
      
      // Sinon, préférer celui avec plus de mémoire
      const currentMem = current.limits?.maxBufferSize || 0;
      const bestMem = best.limits?.maxBufferSize || 0;
      return currentMem > bestMem ? current : best;
    });

    return { preferredGPU, allAdapters: adapters };
  } catch (error) {
    return {
      preferredGPU: {
        ...defaultError,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      allAdapters: [],
    };
  }
}

export function getGPURecommendation(gpuInfo: GPUInfo): {
  canRun: boolean;
  recommendedModel: string;
  modelTier: "tiny" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "medium_f32" | "large_f32" | "xlarge_f32" | "xxlarge_f32";
  message: string;
  supportsF16: boolean;
} {
  if (!gpuInfo.available) {
    return {
      canRun: false,
      recommendedModel: "",
      modelTier: "tiny",
      message: gpuInfo.error || "WebGPU non disponible",
      supportsF16: false,
    };
  }

  if (gpuInfo.isFallback) {
    // Message spécifique pour SwiftShader avec instructions pour activer Vulkan
    if (gpuInfo.isSwiftShader) {
      return {
        canRun: false,
        recommendedModel: "",
        modelTier: "tiny",
        message: "⚠️ SwiftShader détecté (émulation CPU). Votre GPU n'est pas utilisé !\n\n" +
          "Pour activer Vulkan dans Chrome :\n" +
          "1. Allez à chrome://flags/#enable-vulkan → Enabled\n" +
          "2. Allez à chrome://flags/#use-vulkan → Enabled\n" +
          "3. Redémarrez Chrome\n\n" +
          "Ou lancez Chrome avec : google-chrome --enable-features=Vulkan",
        supportsF16: false,
      };
    }
    return {
      canRun: false,
      recommendedModel: "",
      modelTier: "tiny",
      message: "Seul un adaptateur GPU de secours (software) est disponible. Les performances seraient trop faibles.",
      supportsF16: false,
    };
  }

  const maxBuffer = gpuInfo.limits?.maxBufferSize || 0;
  const maxBufferGB = maxBuffer / (1024 * 1024 * 1024);
  const supportsF16 = gpuInfo.supportsF16;
  const f16Status = supportsF16 ? "✓ f16" : "⚠ f32 uniquement";

  // Détecter les GPU Nvidia haut de gamme par leur nom (car maxBufferSize WebGPU est limité)
  const descLower = gpuInfo.description.toLowerCase();
  const isHighEndNvidia = 
    descLower.includes("3090") || descLower.includes("3080") ||
    descLower.includes("4090") || descLower.includes("4080") || descLower.includes("4070") ||
    descLower.includes("a100") || descLower.includes("a6000") || descLower.includes("a5000") ||
    descLower.includes("titan");
  const isMidRangeNvidia = 
    descLower.includes("3070") || descLower.includes("3060") ||
    descLower.includes("4060") || descLower.includes("2080") || descLower.includes("2070");

  // GPU Nvidia dédié - meilleur support WebGPU (supporte généralement f16)
  if (gpuInfo.isNvidia && !gpuInfo.isIntegrated) {
    // RTX 3080, 3090, 4070+, etc. - modèle 8B
    if (isHighEndNvidia) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC" : "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
        modelTier: supportsF16 ? "xxlarge" : "xxlarge_f32",
        message: `🚀 GPU Nvidia haut de gamme détecté (${gpuInfo.description}). Modèle 8B recommandé ! ${f16Status}`,
        supportsF16,
      };
    }
    // RTX 3060, 3070, 4060 etc. - modèle 3B
    if (isMidRangeNvidia || maxBufferGB >= 5) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Llama-3.2-3B-Instruct-q4f16_1-MLC" : "Llama-3.2-3B-Instruct-q4f32_1-MLC",
        modelTier: supportsF16 ? "xlarge" : "xlarge_f32",
        message: `🎮 GPU Nvidia performant détecté (${gpuInfo.description}). Modèle 3B recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    // GPU Nvidia entrée de gamme (>=4 Go VRAM)
    if (maxBufferGB >= 4) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Qwen3-1.7B-q4f16_1-MLC" : "Qwen3-1.7B-q4f32_1-MLC",
        modelTier: supportsF16 ? "large" : "large_f32",
        message: `🎮 GPU Nvidia détecté (${gpuInfo.description}). Modèle 1.7B recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC",
      modelTier: supportsF16 ? "medium" : "medium_f32",
      message: `🎮 GPU Nvidia détecté (${gpuInfo.description}). Modèle moyen recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU AMD dédié
  if (gpuInfo.isAMD && !gpuInfo.isIntegrated) {
    if (maxBufferGB >= 4) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC",
        modelTier: supportsF16 ? "medium" : "medium_f32",
        message: `🎮 GPU AMD dédié détecté (${gpuInfo.description}). Modèle moyen recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
      modelTier: "small",
      message: `🎮 GPU AMD détecté (${gpuInfo.description}). Modèle léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU Apple Silicon (M1, M2, M3, M4) - très performant avec bon support f16
  if (gpuInfo.isApple) {
    if (maxBufferGB >= 4) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Qwen3-1.7B-q4f16_1-MLC" : "Qwen3-1.7B-q4f32_1-MLC",
        modelTier: supportsF16 ? "large" : "large_f32",
        message: ` GPU Apple Silicon détecté (${gpuInfo.description}). Modèle puissant recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    if (maxBufferGB >= 2) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC",
        modelTier: supportsF16 ? "medium" : "medium_f32",
        message: ` GPU Apple Silicon détecté (${gpuInfo.description}). Modèle moyen recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
      modelTier: "small",
      message: ` GPU Apple détecté (${gpuInfo.description}). Modèle léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU mobile Adreno (Qualcomm - Android haut de gamme)
  if (gpuInfo.isAdreno) {
    if (maxBufferGB >= 2) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC",
        modelTier: supportsF16 ? "medium" : "medium_f32",
        message: `📱 GPU Adreno détecté (${gpuInfo.description}). Modèle moyen recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
      modelTier: "small",
      message: `📱 GPU Adreno détecté (${gpuInfo.description}). Modèle léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU mobile Mali (ARM - Android milieu de gamme)
  if (gpuInfo.isMali) {
    if (maxBufferGB >= 1) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
        modelTier: "small",
        message: `📱 GPU Mali détecté (${gpuInfo.description}). Modèle léger recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-135M-Instruct-q0f16-MLC" : "SmolLM2-135M-Instruct-q0f32-MLC",
      modelTier: "tiny",
      message: `📱 GPU Mali détecté (${gpuInfo.description}). Modèle très léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU mobile PowerVR (moins courant)
  if (gpuInfo.isPowerVR) {
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-135M-Instruct-q0f16-MLC" : "SmolLM2-135M-Instruct-q0f32-MLC",
      modelTier: "tiny",
      message: `📱 GPU PowerVR détecté (${gpuInfo.description}). Modèle très léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU intégré (Intel, AMD APU) - généralement pas de support f16
  if (gpuInfo.isIntegrated) {
    if (maxBufferGB >= 1) {
      return {
        canRun: true,
        recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
        modelTier: "small",
        message: `💻 GPU intégré détecté (${gpuInfo.description}). Modèle léger recommandé. ${f16Status}`,
        supportsF16,
      };
    }
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "SmolLM2-135M-Instruct-q0f16-MLC" : "SmolLM2-135M-Instruct-q0f32-MLC",
      modelTier: "tiny",
      message: `💻 GPU intégré avec mémoire limitée. Modèle très léger recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  // GPU inconnu mais disponible
  if (maxBufferGB >= 2) {
    return {
      canRun: true,
      recommendedModel: supportsF16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC",
      modelTier: supportsF16 ? "medium" : "medium_f32",
      message: `GPU détecté (${gpuInfo.description}). Modèle moyen recommandé. ${f16Status}`,
      supportsF16,
    };
  }

  return {
    canRun: true,
    recommendedModel: supportsF16 ? "SmolLM2-360M-Instruct-q4f16_1-MLC" : "SmolLM2-360M-Instruct-q4f32_1-MLC",
    modelTier: "small",
    message: `GPU détecté (${gpuInfo.description}). Modèle standard recommandé. ${f16Status}`,
    supportsF16,
  };
}
