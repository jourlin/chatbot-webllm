import { useEffect, useState } from "react";
import type { LoadingStatus } from "@/lib/webllm-service";
import { detectAllGPUs, getGPURecommendation, type AllGPUsInfo } from "@/lib/gpu-detect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle, Cpu, Monitor, Zap, Smartphone } from "lucide-react";

interface ModelLoaderProps {
  status: LoadingStatus;
  onLoad: (modelId: string) => void;
}

export function ModelLoader({ status, onLoad }: ModelLoaderProps) {
  const [gpuData, setGpuData] = useState<AllGPUsInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    detectAllGPUs().then((data) => {
      setGpuData(data);
      setIsDetecting(false);
    });
  }, []);

  if (status.isReady) {
    return null;
  }

  const gpuInfo = gpuData?.preferredGPU || null;
  const allGPUs = gpuData?.allAdapters || [];
  const recommendation = gpuInfo ? getGPURecommendation(gpuInfo) : null;

  const handleLoad = () => {
    if (recommendation?.recommendedModel) {
      onLoad(recommendation.recommendedModel);
    }
  };

  // Bloquer les clics à travers l'overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Chatbot IA Local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status.error ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Erreur WebGPU</span>
              </div>
              <p className="text-sm text-muted-foreground">{status.error}</p>
              <div className="bg-muted rounded-lg p-4 text-left text-xs space-y-2">
                <p><strong>Pour activer WebGPU sur Chromium/Linux :</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ouvrez <code className="bg-background px-1 rounded">chrome://flags</code></li>
                  <li>Recherchez "WebGPU"</li>
                  <li>Activez "Unsafe WebGPU Support"</li>
                  <li>Redémarrez le navigateur</li>
                </ol>
                <p className="mt-2">Ou utilisez <strong>Google Chrome</strong> (meilleur support).</p>
                <p>Vérifiez sur <a href="https://webgpureport.org" target="_blank" className="text-primary underline">webgpureport.org</a></p>
              </div>
              <Button onClick={handleLoad} variant="outline">
                Réessayer
              </Button>
            </div>
          ) : status.isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Chargement du modèle...</span>
              </div>
              {status.modelId && (
                <p className="text-xs text-center text-muted-foreground">
                  {status.modelId.split("-q")[0]}
                </p>
              )}
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {status.progress}% - {status.text}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Le modèle sera mis en cache pour les prochaines visites.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Ce chatbot utilise un modèle IA qui s'exécute entièrement dans votre navigateur.
                Aucune donnée n'est envoyée à un serveur externe.
              </p>
              
              {/* Disclaimer */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
                <p className="mb-1">
                  ⚠️ <strong>Avertissement :</strong> Les réponses générées par l'IA peuvent contenir des erreurs 
                  ou des informations inexactes. L'auteur décline toute responsabilité quant à l'utilisation 
                  des résultats produits par ce logiciel.
                </p>
                <p className="mt-2 text-center">
                  © 2026 Pierre Jourlin — <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Licence Apache 2.0</a>
                </p>
              </div>
              
              {/* GPU Detection */}
              <div className="bg-muted rounded-lg p-4 text-left text-xs space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Monitor className="h-4 w-4" />
                  <span>GPU Détectés ({allGPUs.length})</span>
                </div>
                
                {isDetecting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Analyse du matériel...</span>
                  </div>
                ) : allGPUs.length > 0 ? (
                  <div className="space-y-3">
                    {/* Liste de tous les GPU */}
                    {allGPUs.map((gpu, index) => {
                      const isSelected = gpu.description === gpuInfo?.description;
                      return (
                        <div 
                          key={index}
                          className={`p-2 rounded border ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <div className="flex items-center gap-2">
                            {gpu.isMobile ? (
                              <Smartphone className="h-4 w-4 text-purple-500" />
                            ) : gpu.isNvidia ? (
                              <Zap className="h-4 w-4 text-green-500" />
                            ) : gpu.isApple ? (
                              <Cpu className="h-4 w-4 text-gray-400" />
                            ) : gpu.isIntegrated ? (
                              <Cpu className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Monitor className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium flex-1">{gpu.description}</span>
                            {isSelected && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Sélectionné
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1 mt-1 text-muted-foreground">
                            <span>Type:</span>
                            <span className={gpu.isMobile ? "text-purple-600" : gpu.isIntegrated && !gpu.isApple ? "text-yellow-600" : "text-green-600"}>
                              {gpu.isAdreno ? "Adreno" : gpu.isMali ? "Mali" : gpu.isPowerVR ? "PowerVR" : gpu.isNvidia ? "Nvidia" : gpu.isAMD ? "AMD" : gpu.isApple ? "Apple" : gpu.isIntel ? "Intel" : "Autre"}
                              {gpu.isMobile ? " (mobile)" : gpu.isApple ? " Silicon" : gpu.isIntegrated ? " (intégré)" : " (dédié)"}
                            </span>
                            <span>Float16:</span>
                            <span className={gpu.supportsF16 ? "text-green-600" : "text-yellow-600"}>
                              {gpu.supportsF16 ? "✓ Supporté" : "✗ Non supporté"}
                            </span>
                            {gpu.limits && (
                              <>
                                <span>Buffer max:</span>
                                <span>{(gpu.limits.maxBufferSize / (1024 * 1024 * 1024)).toFixed(2)} Go</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Recommandation */}
                    {recommendation && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className={recommendation.canRun ? "text-green-600" : "text-red-600"}>
                          {recommendation.message}
                        </p>
                        {recommendation.canRun && (
                          <p className="text-muted-foreground mt-1">
                            <strong>Modèle sélectionné :</strong> {recommendation.recommendedModel.split("-q")[0]}
                            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded">
                              {recommendation.modelTier}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {gpuInfo?.error || "Aucun GPU WebGPU compatible trouvé"}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleLoad} 
                className="w-full"
                disabled={isDetecting || !recommendation?.canRun}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Charger le modèle optimal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
