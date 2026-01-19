import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Extraire les blocs <think> du contenu
function parseThinkBlocks(content: string): Array<{ type: "text" | "think"; content: string }> {
  const parts: Array<{ type: "text" | "think"; content: string }> = [];
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = thinkRegex.exec(content)) !== null) {
    // Ajouter le texte avant le bloc think
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
    }
    
    // Ajouter le bloc think
    parts.push({ type: "think", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le texte restant après le dernier bloc think
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) {
      parts.push({ type: "text", content: remaining });
    }
  }
  
  // Si aucun bloc think trouvé, retourner le contenu original
  if (parts.length === 0) {
    return [{ type: "text", content }];
  }
  
  return parts;
}

// Composant pour afficher un bloc de réflexion
function ThinkBlock({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="my-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Brain className="h-4 w-4" />
        <span className="font-medium">Réflexion</span>
        {!isExpanded && (
          <span className="text-xs text-purple-500 dark:text-purple-400 ml-2 truncate flex-1">
            {content.slice(0, 50)}...
          </span>
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 py-2 border-t border-purple-200 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// Composants personnalisés pour le rendu Markdown
const markdownComponents = {
  // Paragraphes
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  
  // Titres
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
  ),
  
  // Listes
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="ml-2">{children}</li>
  ),
  
  // Code
  code: ({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">
          {children}
        </code>
      );
    }
    return (
      <code className={cn("block p-3 rounded-lg bg-muted font-mono text-sm overflow-x-auto mb-2", className)}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-2 overflow-x-auto">{children}</pre>
  ),
  
  // Liens
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </a>
  ),
  
  // Citations
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2 text-muted-foreground">
      {children}
    </blockquote>
  ),
  
  // Tableaux
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border-collapse border border-border">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-border px-3 py-1.5 bg-muted font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-border px-3 py-1.5">{children}</td>
  ),
  
  // Séparateur
  hr: () => <hr className="my-4 border-border" />,
  
  // Texte fort et italique
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const parts = parseThinkBlocks(content);
  
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      {parts.map((part, index) => {
        if (part.type === "think") {
          return <ThinkBlock key={index} content={part.content} />;
        }
        
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {part.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
