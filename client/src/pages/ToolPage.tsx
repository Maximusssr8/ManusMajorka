import { useLocation } from "wouter";
import { getToolByPath } from "@/lib/tools";
import AIToolChat from "@/components/AIToolChat";
import { createElement } from "react";

export default function ToolPage() {
  const [location] = useLocation();
  const tool = getToolByPath(location);

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Tool not found
          </h2>
          <p className="text-sm text-muted-foreground">This tool doesn't exist yet.</p>
        </div>
      </div>
    );
  }

  const isWebsiteGen = tool.id === "website-generator";

  return (
    <AIToolChat
      key={tool.id}
      toolId={tool.id}
      toolName={tool.label}
      toolDescription={tool.description}
      toolIcon={createElement(tool.icon, { className: "w-4 h-4" })}
      systemPrompt={tool.systemPrompt}
      placeholder={`Ask about ${tool.label.toLowerCase()}...`}
      showHTMLPreview={isWebsiteGen}
    />
  );
}
