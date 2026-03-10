/**
 * Agent Task Store
 *
 * In-memory store for tracking agent orders, their status, and results.
 * Used by the orchestrator to manage multi-agent workflows triggered from N8N.
 */

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTask {
  id: string;
  orderId: string;
  agentId: string;
  agentLabel: string;
  prompt: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AgentOrder {
  id: string;
  userMessage: string;
  orchestratorPlan: string | null;
  tasks: AgentTask[];
  status: TaskStatus;
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
}

// In-memory store — keyed by order ID
const orders = new Map<string, AgentOrder>();

let orderCounter = 0;
let taskCounter = 0;

function generateId(prefix: string): string {
  const count = prefix === "order" ? ++orderCounter : ++taskCounter;
  return `${prefix}_${Date.now()}_${count}`;
}

export function createOrder(userMessage: string): AgentOrder {
  const order: AgentOrder = {
    id: generateId("order"),
    userMessage,
    orchestratorPlan: null,
    tasks: [],
    status: "pending",
    summary: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  orders.set(order.id, order);
  return order;
}

export function addTask(
  orderId: string,
  agentId: string,
  agentLabel: string,
  prompt: string
): AgentTask {
  const order = orders.get(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  const task: AgentTask = {
    id: generateId("task"),
    orderId,
    agentId,
    agentLabel,
    prompt,
    status: "pending",
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
  order.tasks.push(task);
  return task;
}

export function updateTask(
  orderId: string,
  taskId: string,
  update: Partial<Pick<AgentTask, "status" | "result" | "error" | "startedAt" | "completedAt">>
): AgentTask | null {
  const order = orders.get(orderId);
  if (!order) return null;

  const task = order.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  Object.assign(task, update);

  // Recompute order status based on tasks
  const allDone = order.tasks.every((t) => t.status === "completed" || t.status === "failed");
  const anyRunning = order.tasks.some((t) => t.status === "running");
  const anyFailed = order.tasks.some((t) => t.status === "failed");

  if (allDone) {
    order.status = anyFailed ? "failed" : "completed";
    order.completedAt = new Date().toISOString();
  } else if (anyRunning) {
    order.status = "running";
  }

  return task;
}

export function updateOrder(
  orderId: string,
  update: Partial<Pick<AgentOrder, "orchestratorPlan" | "summary" | "status">>
): AgentOrder | null {
  const order = orders.get(orderId);
  if (!order) return null;
  Object.assign(order, update);
  return order;
}

export function getOrder(orderId: string): AgentOrder | null {
  return orders.get(orderId) ?? null;
}

export function listOrders(limit = 20): AgentOrder[] {
  return Array.from(orders.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function deleteOrder(orderId: string): boolean {
  return orders.delete(orderId);
}
