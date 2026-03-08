import { useLocation } from "wouter";
import { getToolByPath } from "@/lib/tools";
import AIToolChat from "@/components/AIToolChat";
import WebsiteGenerator from "./WebsiteGenerator";
import MetaAdsPack from "./MetaAdsPack";
import { createElement } from "react";

export default function ToolPage() {
  const [location] = useLocation();
  const tool = getToolByPath(location);

  // Route dedicated tool pages
  if (location === "/app/website-generator") return <WebsiteGenerator />;
  if (location === "/app/meta-ads-pack") return <MetaAdsPack />;

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#0a0b0d" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
            Tool not found
          </h2>
          <p className="text-sm" style={{ color: "rgba(240,237,232,0.4)" }}>This tool doesn't exist yet.</p>
        </div>
      </div>
    );
  }

  return (
    <AIToolChat
      key={tool.id}
      toolId={tool.id}
      toolName={tool.label}
      toolDescription={tool.description}
      toolIcon={createElement(tool.icon, { className: "w-4 h-4" })}
      systemPrompt={tool.systemPrompt}
      placeholder={`Ask ${tool.label.toLowerCase()}...`}
      showHTMLPreview={false}
    />
  );
}
