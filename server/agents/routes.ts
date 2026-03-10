/**
 * Agent API Routes
 *
 * REST endpoints for N8N to interact with the Majorka agent orchestration system.
 *
 * Endpoints:
 *   GET  /api/agents             — List all available agents
 *   POST /api/agents/orchestrate — Submit a request to the orchestrator (main agent)
 *   POST /api/agents/execute     — Execute a single specific agent directly
 *   GET  /api/agents/orders      — List recent orders
 *   GET  /api/agents/orders/:id  — Get a specific order with all task results
 *   DELETE /api/agents/orders/:id — Delete an order
 */

import type { Express } from "express";
import { listAgents } from "./tools";
import { orchestrate } from "./orchestrator";
import { executeAgent } from "./executor";
import { getOrder, listOrders, deleteOrder } from "./store";

export function registerAgentRoutes(app: Express) {
  /**
   * GET /api/agents
   * List all available agents with their id, label, stage, and description.
   * Use this in N8N to populate dropdowns or see what agents are available.
   */
  app.get("/api/agents", (_req, res) => {
    res.json({
      agents: listAgents(),
      total: listAgents().length,
    });
  });

  /**
   * POST /api/agents/orchestrate
   * Submit a message to the main orchestrator agent.
   * It will analyse your request, delegate to specialist agents, and return
   * a compiled summary with all individual agent results.
   *
   * Body: { "message": "Your request here", "context"?: "optional context" }
   *
   * N8N usage: HTTP Request node → POST → http://localhost:3000/api/agents/orchestrate
   */
  app.post("/api/agents/orchestrate", async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "message (string) is required" });
        return;
      }

      console.log(`[Orchestrator] New order: "${message.slice(0, 100)}..."`);

      const result = await orchestrate(message, context);

      res.json({
        orderId: result.order.id,
        status: result.order.status,
        plan: result.order.orchestratorPlan,
        summary: result.order.summary,
        tasks: result.order.tasks.map((t) => ({
          id: t.id,
          agentId: t.agentId,
          agentLabel: t.agentLabel,
          status: t.status,
          result: t.result,
          error: t.error,
        })),
      });
    } catch (err: any) {
      console.error("[Orchestrator] Error:", err);
      res.status(500).json({ error: err.message || "Orchestration failed" });
    }
  });

  /**
   * POST /api/agents/execute
   * Execute a single agent directly (bypass the orchestrator).
   * Useful when you know exactly which agent you want from N8N.
   *
   * Body: { "agentId": "product-discovery", "prompt": "Find winning fitness products", "context"?: "" }
   *
   * N8N usage: HTTP Request node → POST → http://localhost:3000/api/agents/execute
   */
  app.post("/api/agents/execute", async (req, res) => {
    try {
      const { agentId, prompt, context } = req.body;

      if (!agentId || typeof agentId !== "string") {
        res.status(400).json({ error: "agentId (string) is required" });
        return;
      }
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "prompt (string) is required" });
        return;
      }

      console.log(`[Agent Execute] Running ${agentId}: "${prompt.slice(0, 80)}..."`);

      const result = await executeAgent({ agentId, prompt, context });

      res.json({
        agentId: result.agentId,
        response: result.response,
        tokensUsed: result.tokensUsed,
      });
    } catch (err: any) {
      console.error("[Agent Execute] Error:", err);
      res.status(500).json({ error: err.message || "Agent execution failed" });
    }
  });

  /**
   * GET /api/agents/orders
   * List recent orchestration orders. Optional ?limit=N query param.
   */
  app.get("/api/agents/orders", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const orders = listOrders(limit);
    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        userMessage: o.userMessage,
        plan: o.orchestratorPlan,
        taskCount: o.tasks.length,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
      })),
    });
  });

  /**
   * GET /api/agents/orders/:id
   * Get full details of a specific order including all task results.
   */
  app.get("/api/agents/orders/:id", (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  });

  /**
   * DELETE /api/agents/orders/:id
   * Delete an order from the store.
   */
  app.delete("/api/agents/orders/:id", (req, res) => {
    const deleted = deleteOrder(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ deleted: true });
  });
}
