import {
  Liveblocks,
  createGoogleGenerativeAI,
  external_exports,
  generateObject,
  mutateFlow
} from "./chunk-HY2KA24U.mjs";
import "./chunk-NIH7TPK3.mjs";
import {
  logger,
  task
} from "./chunk-5MZFGH3M.mjs";
import "./chunk-TZ5SZRRN.mjs";
import {
  __name,
  init_esm
} from "./chunk-Z6TFXI5D.mjs";

// trigger/design-agent.ts
init_esm();
var liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY
});
var googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
});
var model = googleProvider("gemini-2.5-flash");
var SYSTEM_PROMPT = `You are Ghost AI, an expert software systems architect collaborating with a user on a visual canvas workspace.
Your task is to analyze the user's architectural request and determine the surgical additions, modifications, or deletions needed to realize their request on a 2D canvas.

The canvas operates in a standard coordinate space where:
- x increases to the right.
- y increases downward.
- Standard service nodes are about 150px wide and 80px high.
- Database nodes and circular event endpoints are about 80-100px wide.
- Place new components cleanly to form a flowchart layout, preventing overlaps.
- Space nodes nicely (e.g. horizontal gap dx = 250px, vertical gap dy = 180px).

Supported Shapes (You MUST use one of these EXACT shapes):
- rectangle (general component, server, web server)
- diamond (decision, load balancer, API gateway)
- circle (event source, endpoint, webhook)
- pill (microservice, container, cloud function)
- cylinder (database, cache, file storage)
- hexagon (external system, third-party API)

Allowed Colors (You MUST assign one of these EXACT HSL theme hex fills):
- Neutral dark: '#1F1F1F'
- Blue: '#10233D'
- Purple: '#2E1938'
- Orange: '#331B00'
- Red: '#3C1618'
- Pink: '#3A1726'
- Green: '#0F2E18'
- Teal: '#062822'

Supported Connection Handles (You MUST restrict handles to these four):
- top
- right
- bottom
- left

Determine the differences (deltas) to apply:
1. nodesToAdd: New nodes to insert. Give them descriptive unique string IDs (e.g., 'auth_service', 'postgresql_db') and logical x, y positions. Set their type to 'canvasNode'.
2. nodesToUpdate: Surgical properties to edit on existing nodes (change shape, color, or coordinates).
3. nodeIdsToRemove: IDs of nodes that should be deleted.
4. edgesToAdd: New edges to draw between nodes. Assign descriptive unique string IDs (e.g. 'edge-gateway-auth').
5. edgeIdsToRemove: IDs of edges to delete.

Be highly surgical. Preserve existing custom-positioned nodes unless asked to remove or fully restructure them.
Finally, construct a professional 'userExplanation' in clean markdown format summarizing the architecture choices and changes made.`;
var designAgentTask = task({
  id: "design-agent",
  run: /* @__PURE__ */ __name(async (payload, { ctx }) => {
    logger.log("Design agent execution started", {
      runId: ctx.run.id,
      roomId: payload.roomId,
      prompt: payload.prompt
    });
    try {
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: true,
        text: "Ghost AI is analyzing the architecture request..."
      });
      await mutateFlow({ client: liveblocks, roomId: payload.roomId }, async (flow) => {
        const currentNodes = flow.nodes || [];
        const currentEdges = flow.edges || [];
        logger.log("Active canvas snapshot pulled", {
          nodeCount: currentNodes.length,
          edgeCount: currentEdges.length
        });
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: true,
          text: "Ghost AI is designing systems architecture & calculating layout..."
        });
        const userPrompt = `Existing Nodes: ${JSON.stringify(currentNodes.map((n) => {
          const data = n.data;
          return { id: n.id, label: data?.label, color: data?.color, shape: data?.shape, position: n.position };
        }))}
Existing Edges: ${JSON.stringify(currentEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label })))}

User architectural request: "${payload.prompt}"`;
        const { object: delta } = await generateObject({
          model,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          schema: external_exports.object({
            thinkingReasoning: external_exports.string().describe("Internal analysis of the architecture changes required"),
            nodesToAdd: external_exports.array(
              external_exports.object({
                id: external_exports.string(),
                label: external_exports.string(),
                shape: external_exports.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
                color: external_exports.enum(["#1F1F1F", "#10233D", "#2E1938", "#331B00", "#3C1618", "#3A1726", "#0F2E18", "#062822"]),
                position: external_exports.object({ x: external_exports.number(), y: external_exports.number() }),
                width: external_exports.number().default(150),
                height: external_exports.number().default(80)
              })
            ),
            nodesToUpdate: external_exports.array(
              external_exports.object({
                id: external_exports.string(),
                label: external_exports.string().optional(),
                shape: external_exports.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional(),
                color: external_exports.enum(["#1F1F1F", "#10233D", "#2E1938", "#331B00", "#3C1618", "#3A1726", "#0F2E18", "#062822"]).optional(),
                position: external_exports.object({ x: external_exports.number(), y: external_exports.number() }).optional(),
                width: external_exports.number().optional(),
                height: external_exports.number().optional()
              })
            ),
            nodeIdsToRemove: external_exports.array(external_exports.string()),
            edgesToAdd: external_exports.array(
              external_exports.object({
                id: external_exports.string(),
                source: external_exports.string(),
                target: external_exports.string(),
                sourceHandle: external_exports.enum(["top", "right", "bottom", "left"]).default("right"),
                targetHandle: external_exports.enum(["top", "right", "bottom", "left"]).default("left"),
                label: external_exports.string().optional()
              })
            ),
            edgeIdsToRemove: external_exports.array(external_exports.string()),
            userExplanation: external_exports.string().describe("A beautiful, supportive architectural summary in markdown format explaining the design changes to the user")
          })
        });
        logger.log("LLM architectural delta determined", { delta });
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: true,
          text: "Ghost AI is rendering elements directly onto your canvas..."
        });
        for (const id of delta.nodeIdsToRemove) {
          flow.removeNode(id);
          logger.log(`Node removed: ${id}`);
        }
        for (const id of delta.edgeIdsToRemove) {
          flow.removeEdge(id);
          logger.log(`Edge removed: ${id}`);
        }
        for (const update of delta.nodesToUpdate) {
          flow.updateNode(update.id, (node) => {
            if (!node) return node;
            const nextData = { ...node.data };
            if (update.label !== void 0) nextData.label = update.label;
            if (update.color !== void 0) nextData.color = update.color;
            if (update.shape !== void 0) nextData.shape = update.shape;
            return {
              ...node,
              data: nextData,
              position: update.position ?? node.position,
              width: update.width ?? node.width,
              height: update.height ?? node.height
            };
          });
          logger.log(`Node updated: ${update.id}`);
        }
        for (const node of delta.nodesToAdd) {
          flow.addNode({
            id: node.id,
            type: "canvasNode",
            position: node.position,
            width: node.width,
            height: node.height,
            data: {
              label: node.label,
              color: node.color,
              shape: node.shape
            }
          });
          logger.log(`Node added: ${node.id}`);
        }
        for (const edge of delta.edgesToAdd) {
          flow.addEdge({
            id: edge.id,
            type: "canvasEdge",
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            data: edge.label ? { label: edge.label } : void 0
          });
          logger.log(`Edge added: ${edge.id}`);
        }
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-chat",
          id: `ai-msg-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Ghost AI",
            avatar: "",
            color: "#6457f9"
          },
          role: "assistant",
          content: delta.userExplanation,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: false
      });
      logger.log("Design agent execution complete");
      return {
        status: "success",
        runId: ctx.run.id
      };
    } catch (error) {
      console.error("[DESIGN_AGENT_TASK]", error);
      try {
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: false
        });
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-chat",
          id: `ai-error-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Ghost AI",
            avatar: "",
            color: "#6457f9"
          },
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error while trying to process your request. Please try again!`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast error status", broadcastErr);
      }
      throw error;
    }
  }, "run")
});
export {
  designAgentTask
};
//# sourceMappingURL=design-agent.mjs.map
