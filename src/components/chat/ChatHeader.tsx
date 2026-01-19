import { Button } from "@/components/ui/button";
import { Bot, Trash2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

interface ChatHeaderProps {
  onClear: () => void;
  messagesCount: number;
  modelId?: string;
}

export function ChatHeader({ onClear, messagesCount, modelId }: ChatHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for system preference or saved preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  // Extraire le nom du modèle de façon lisible
  const modelName = modelId ? modelId.split("-q")[0] : "Chargement...";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Chatbot IA Local</h1>
            <p className="text-xs text-muted-foreground">
              {modelName} • Fonctionne hors-ligne
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {messagesCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              title="Effacer la conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
