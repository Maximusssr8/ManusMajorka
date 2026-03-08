import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Copy, ClipboardList, Loader2, CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface Task { title: string; status: "todo" | "in-progress" | "done"; priority: "high" | "medium" | "low"; estimate: string; }
interface Phase { name: string; tasks: Task[]; deadline: string; }
interface ProjectResult { name: string; summary: string; phases: Phase[]; totalTasks: number; estimatedWeeks: number; }

export default function ProjectManager() {
  const [projectGoal, setProjectGoal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [constraints, setConstraints] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }: any) {
        return {
          body: {
            messages: messages.map((m: any) => ({ role: m.role, content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "" })),
            systemPrompt: `You are a project manager for e-commerce businesses. Output JSON: {"name":"Project Name","summary":"overview","estimatedWeeks":8,"totalTasks":20,"phases":[{"name":"Phase 1: Setup","deadline":"Week 1-2","tasks":[{"title":"task","status":"todo","priority":"high","estimate":"2h"}]}]}. Include 4-6 phases with 3-5 tasks each. Output ONLY JSON.`,
          },
        };
      },
    }),
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      const text = last.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "";
      try {
        const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
        if (parsed.phases) { setResult(parsed); setGenerating(false); toast.success("Project plan generated!"); }
      } catch { /* streaming */ }
    }
  }, [messages]);

  const handleGenerate = useCallback(async () => {
    if (!projectGoal) { toast.error("Describe your project goal."); return; }
    setGenerating(true); setResult(null); setCompletedTasks(new Set());
    sendMessage({ text: `Create a project plan for: ${projectGoal}\nTimeline: ${timeline || "Flexible"}\nTeam size: ${teamSize}\nConstraints: ${constraints || "None"}` });
  }, [projectGoal, timeline, teamSize, constraints, sendMessage]);

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const totalTasks = result ? result.phases.reduce((sum, p) => sum + p.tasks.length, 0) : 0;
  const doneCount = completedTasks.size;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.name}\n${result.summary}\n\n${result.phases.map(p => `${p.name} (${p.deadline})\n${p.tasks.map(t => `  [${completedTasks.has(`${p.name}-${t.title}`) ? "x" : " "}] ${t.title} (${t.priority}, ${t.estimate})`).join("\n")}`).join("\n\n")}`);
    toast.success("Copied!");
  };

  const priorityColor = (p: string) => p === "high" ? "#ff6b6b" : p === "medium" ? "#f0c040" : "rgba(240,237,232,0.4)";

  return (
    <div className="h-full flex" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      <div className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)", scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(156,95,255,0.12)", border: "1px solid rgba(156,95,255,0.3)" }}>
            <ClipboardList size={15} style={{ color: "#9c5fff" }} />
          </div>
          <div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>Project Manager</div>
            <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Tasks · Phases · Timeline</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>
            Project Goal <span style={{ color: "#9c5fff" }}>*</span>
          </label>
          <textarea value={projectGoal} onChange={e => setProjectGoal(e.target.value)}
            placeholder="e.g. Launch a pet accessories Shopify store with 20 products, Meta Ads, and email marketing"
            rows={3} className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
            onFocus={e => (e.target.style.borderColor = "rgba(156,95,255,0.45)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
        </div>

        {[
          { label: "Timeline", value: timeline, set: setTimeline, placeholder: "e.g. 8 weeks" },
          { label: "Team Size", value: teamSize, set: setTeamSize, placeholder: "e.g. 1" },
          { label: "Constraints", value: constraints, set: setConstraints, placeholder: "e.g. $2k budget, part-time" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>{label}</label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
              onFocus={e => (e.target.style.borderColor = "rgba(156,95,255,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
          </div>
        ))}

        <button onClick={handleGenerate} disabled={generating}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ background: generating ? "rgba(156,95,255,0.25)" : "linear-gradient(135deg, #9c5fff, #7c6af5)", color: "#fff", fontFamily: "Syne, sans-serif", boxShadow: generating ? "none" : "0 4px 20px rgba(156,95,255,0.3)", cursor: generating ? "not-allowed" : "pointer" }}>
          {generating ? <><Loader2 size={14} className="animate-spin" /> Planning…</> : <><ClipboardList size={14} /> Generate Plan</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
        {result ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>{result.name}</h2>
                <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{result.estimatedWeeks} weeks · {totalTasks} tasks</div>
              </div>
              <button onClick={copyAll} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,237,232,0.6)", cursor: "pointer" }}>
                <Copy size={11} /> Copy All
              </button>
            </div>

            {/* Progress */}
            <div className="rounded-xl p-4" style={{ background: "rgba(156,95,255,0.06)", border: "1px solid rgba(156,95,255,0.2)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#9c5fff" }}>Progress</span>
                <span className="text-xs font-mono" style={{ color: "#9c5fff" }}>{doneCount}/{totalTasks} ({progress}%)</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #9c5fff, #7c6af5)" }} />
              </div>
            </div>

            <div className="text-xs leading-relaxed rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,237,232,0.6)" }}>{result.summary}</div>

            {/* Phases */}
            {result.phases.map((phase, pi) => (
              <div key={pi} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#9c5fff", fontFamily: "Syne, sans-serif" }}>{phase.name}</div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
                    <Clock size={10} /> {phase.deadline}
                  </div>
                </div>
                {phase.tasks.map((task, ti) => {
                  const key = `${phase.name}-${task.title}`;
                  const done = completedTasks.has(key);
                  return (
                    <div key={ti} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{ borderBottom: ti < phase.tasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      onClick={() => toggleTask(key)}>
                      {done ? <CheckCircle2 size={14} style={{ color: "#2dca72" }} /> : <Circle size={14} style={{ color: "rgba(240,237,232,0.2)" }} />}
                      <span className={`text-xs flex-1 ${done ? "line-through" : ""}`} style={{ color: done ? "rgba(240,237,232,0.3)" : "rgba(240,237,232,0.7)" }}>{task.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: priorityColor(task.priority), background: `${priorityColor(task.priority)}12` }}>{task.priority}</span>
                      <span className="text-xs font-mono" style={{ color: "rgba(240,237,232,0.3)" }}>{task.estimate}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {generating ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#9c5fff" }} />
                <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Building your project plan…</div>
              </div>
            ) : (
              <>
                <div className="text-5xl">📋</div>
                <div className="text-center">
                  <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Project Manager</div>
                  <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                    Describe your project goal to get a phased task board with priorities, time estimates, and interactive checkboxes.
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
