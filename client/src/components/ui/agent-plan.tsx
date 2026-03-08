"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

interface AgentPlanProps {
  tasks?: Task[];
  title?: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  completed: {
    icon: <CheckCircle2 size={16} />,
    label: "Completed",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
  },
  "in-progress": {
    icon: <CircleDotDashed size={16} />,
    label: "In Progress",
    color: "#d4af37",
    bg: "rgba(212,175,55,0.12)",
  },
  pending: {
    icon: <Circle size={16} />,
    label: "Pending",
    color: "rgba(240,237,232,0.35)",
    bg: "rgba(240,237,232,0.06)",
  },
  "need-help": {
    icon: <CircleAlert size={16} />,
    label: "Needs Help",
    color: "#f97316",
    bg: "rgba(249,115,22,0.12)",
  },
  failed: {
    icon: <CircleX size={16} />,
    label: "Failed",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#22c55e",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["pending"]!;
  return (
    <span
      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: PRIORITY_COLORS[priority] ?? "#71717a" }}
      title={`Priority: ${priority}`}
    />
  );
}

function SubtaskRow({
  subtask,
  taskId,
  expanded,
  onToggleExpand,
  onToggleStatus,
}: {
  subtask: Subtask;
  taskId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
}) {
  const cfg = STATUS_CONFIG[subtask.status] ?? STATUS_CONFIG["pending"]!;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={onToggleStatus}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          style={{ color: cfg.color }}
          title="Toggle status"
        >
          {cfg.icon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-medium cursor-pointer hover:underline"
              style={{ color: subtask.status === "completed" ? "rgba(240,237,232,0.4)" : "#f0ede8", textDecoration: subtask.status === "completed" ? "line-through" : "none" }}
              onClick={onToggleExpand}
            >
              {subtask.title}
            </span>
            <PriorityDot priority={subtask.priority} />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(240,237,232,0.5)" }}>
                  {subtask.description}
                </p>
                {subtask.tools && subtask.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {subtask.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-xs px-2 py-0.5 rounded-md font-mono"
                        style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.2)" }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <StatusBadge status={subtask.status} />
      </div>
    </motion.div>
  );
}

export function AgentPlan({ tasks: initialTasks, title = "AI Task Plan", className }: AgentPlanProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [expandedTasks, setExpandedTasks] = useState<string[]>(
    initialTasks ? [initialTasks[0]?.id ?? ""] : []
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSubtaskExpansion = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`;
    setExpandedSubtasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const statuses = ["completed", "in-progress", "pending", "need-help", "failed"];
        const currentIdx = statuses.indexOf(task.status);
        const newStatus = statuses[(currentIdx + 1) % statuses.length]!;
        return {
          ...task,
          status: newStatus,
          subtasks: task.subtasks.map((s) => ({
            ...s,
            status: newStatus === "completed" ? "completed" : s.status,
          })),
        };
      })
    );
  };

  const toggleSubtaskStatus = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedSubtasks = task.subtasks.map((s) =>
          s.id === subtaskId
            ? { ...s, status: s.status === "completed" ? "pending" : "completed" }
            : s
        );
        const allDone = updatedSubtasks.every((s) => s.status === "completed");
        return { ...task, subtasks: updatedSubtasks, status: allDone ? "completed" : task.status };
      })
    );
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
          {title}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>
            {completedCount}/{tasks.length} tasks
          </span>
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#d4af37" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color: "#d4af37" }}>{progress}%</span>
        </div>
      </div>

      {/* Task list */}
      <LayoutGroup>
        <div className="space-y-2">
          {tasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["pending"]!;
            const isExpanded = expandedTasks.includes(task.id);
            return (
              <motion.div
                key={task.id}
                layout
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Task header row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer select-none"
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
                    className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                    style={{ color: cfg.color }}
                    title="Cycle status"
                  >
                    {cfg.icon}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "Syne, sans-serif",
                          color: task.status === "completed" ? "rgba(240,237,232,0.35)" : "#f0ede8",
                          textDecoration: task.status === "completed" ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </span>
                      <PriorityDot priority={task.priority} />
                      {task.dependencies.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.35)" }}>
                          deps: {task.dependencies.join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(240,237,232,0.45)" }}>
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.4)" }}
                    >
                      {task.subtasks.length} subtasks
                    </span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: "rgba(240,237,232,0.3)", fontSize: 12 }}
                    >
                      ▼
                    </motion.span>
                  </div>
                </div>

                {/* Subtasks */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 space-y-2">
                        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 8 }} />
                        {task.subtasks.map((subtask) => (
                          <SubtaskRow
                            key={subtask.id}
                            subtask={subtask}
                            taskId={task.id}
                            expanded={!!expandedSubtasks[`${task.id}-${subtask.id}`]}
                            onToggleExpand={() => toggleSubtaskExpansion(task.id, subtask.id)}
                            onToggleStatus={() => toggleSubtaskStatus(task.id, subtask.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default AgentPlan;
