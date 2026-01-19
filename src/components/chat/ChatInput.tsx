import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square, Loader2, Paperclip, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttachedFile {
  name: string;
  content: string;
  type: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  isReady: boolean;
}

export function ChatInput({ onSend, onStop, isGenerating, isReady }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if ((input.trim() || attachedFile) && isReady && !isGenerating) {
      let messageContent = input.trim();
      
      // Ajouter le contenu du fichier au message
      if (attachedFile) {
        const filePrefix = `[Document joint: ${attachedFile.name}]\n\n`;
        const fileContent = `---\n${attachedFile.content}\n---\n\n`;
        messageContent = filePrefix + fileContent + (messageContent || "Analyse ce document.");
      }
      
      onSend(messageContent);
      setInput("");
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    
    try {
      const content = await readFileContent(file);
      setAttachedFile({
        name: file.name,
        content,
        type: file.type,
      });
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error);
      alert("Impossible de lire ce fichier. Formats supportés: .txt, .md, .json, .csv, .html, .xml, .js, .ts, .py, .java, .c, .cpp, .css");
    } finally {
      setIsLoadingFile(false);
      // Reset l'input pour permettre de recharger le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  // Vérifier si le fichier a été tronqué
  const isFileTruncated = attachedFile?.content.includes("[... contenu tronqué");

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Affichage du fichier joint */}
        {attachedFile && (
          <div className={cn(
            "mb-2 flex items-center gap-2 rounded-lg px-3 py-2",
            isFileTruncated ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-secondary/50"
          )}>
            <FileText className={cn("h-4 w-4 shrink-0", isFileTruncated ? "text-yellow-600" : "text-primary")} />
            <span className="text-sm truncate flex-1">{attachedFile.name}</span>
            {isFileTruncated && (
              <span className="text-xs text-yellow-600 shrink-0">tronqué</span>
            )}
            <span className="text-xs text-muted-foreground">
              {(attachedFile.content.length / 1024).toFixed(1)} Ko
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={removeAttachment}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          {/* Bouton pour joindre un fichier */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-xl shrink-0"
            onClick={handleFileClick}
            disabled={!isReady || isGenerating || isLoadingFile}
            title="Joindre un document"
          >
            {isLoadingFile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.json,.csv,.html,.xml,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.hpp,.css,.scss,.yaml,.yml,.toml,.ini,.cfg,.log,.sql,.sh,.bash,.zsh,.ps1,.bat"
            onChange={handleFileChange}
          />
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isReady ? (attachedFile ? "Ajoutez une question sur le document..." : "Écrivez votre message...") : "Chargez le modèle pour commencer..."}
              disabled={!isReady}
              className={cn(
                "w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[48px] max-h-[200px]"
              )}
              rows={1}
            />
          </div>
          
          {isGenerating ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={(!input.trim() && !attachedFile) || !isReady}
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
            >
              {!isReady ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour un retour à la ligne
        </p>
      </div>
    </div>
  );
}

// Fonction pour lire le contenu d'un fichier texte
// Limite à ~8000 caractères (~2000 tokens) pour laisser de la place au contexte et à la réponse
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Limiter la taille du contenu (max ~8000 caractères ≈ 2000 tokens)
      // Le modèle a 4096 tokens de contexte, on garde de la marge pour le prompt système et la réponse
      const maxLength = 8000;
      if (content.length > maxLength) {
        resolve(content.substring(0, maxLength) + "\n\n[... contenu tronqué - document trop long pour la fenêtre de contexte du modèle ...]");
      } else {
        resolve(content);
      }
    };
    
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    
    reader.readAsText(file);
  });
}
