import { logger, task } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

/**
 * Configure the Liveblocks node client using the secret key from the environment.
 */
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * Initialize Gemini generative AI model with fallback key resolution.
 */
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
const model = googleProvider("gemini-2.5-flash");

/**
 * System Prompt guiding Gemini to surgically construct and modify the flowchart.
 */
const SYSTEM_PROMPT = `You are Loom AI, an expert software systems architect collaborating with a user on a visual canvas workspace.
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

export const designAgentTask = task({
  id: "design-agent",

  run: async (payload: DesignAgentPayload, { ctx }) => {
    logger.log("Design agent execution started", {
      runId: ctx.run.id,
      roomId: payload.roomId,
      prompt: payload.prompt,
    });

    try {
      // 1. Broadcast start status to the room
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: true,
        text: "Loom AI is analyzing the architecture request...",
      });

      // 2. Open Room Storage, pull current state and apply LLM updates
      await mutateFlow({ client: liveblocks, roomId: payload.roomId }, async (flow) => {
        const currentNodes = flow.nodes || [];
        const currentEdges = flow.edges || [];

        logger.log("Active canvas snapshot pulled", {
          nodeCount: currentNodes.length,
          edgeCount: currentEdges.length,
        });

        // Broadcast progress state
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: true,
          text: "Loom AI is designing systems architecture & calculating layout...",
        });

        // 3. Invoke Gemini to generate canvas operations
        const userPrompt = `Existing Nodes: ${JSON.stringify(currentNodes.map(n => {
          const data = n.data as any;
          return { id: n.id, label: data?.label, color: data?.color, shape: data?.shape, position: n.position };
        }))}
Existing Edges: ${JSON.stringify(currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label })))}

User architectural request: "${payload.prompt}"`;

        const { object: delta } = await generateObject({
          model,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          schema: z.object({
            thinkingReasoning: z.string().describe("Internal analysis of the architecture changes required"),
            nodesToAdd: z.array(
              z.object({
                id: z.string(),
                label: z.string(),
                shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
                color: z.enum(["#1F1F1F", "#10233D", "#2E1938", "#331B00", "#3C1618", "#3A1726", "#0F2E18", "#062822"]),
                position: z.object({ x: z.number(), y: z.number() }),
                width: z.number().default(150),
                height: z.number().default(80),
              })
            ),
            nodesToUpdate: z.array(
              z.object({
                id: z.string(),
                label: z.string().optional(),
                shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional(),
                color: z.enum(["#1F1F1F", "#10233D", "#2E1938", "#331B00", "#3C1618", "#3A1726", "#0F2E18", "#062822"]).optional(),
                position: z.object({ x: z.number(), y: z.number() }).optional(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            ),
            nodeIdsToRemove: z.array(z.string()),
            edgesToAdd: z.array(
              z.object({
                id: z.string(),
                source: z.string(),
                target: z.string(),
                sourceHandle: z.enum(["top", "right", "bottom", "left"]).default("right"),
                targetHandle: z.enum(["top", "right", "bottom", "left"]).default("left"),
                label: z.string().optional(),
              })
            ),
            edgeIdsToRemove: z.array(z.string()),
            userExplanation: z.string().describe("A beautiful, supportive architectural summary in markdown format explaining the design changes to the user"),
          }),
        });

        logger.log("LLM architectural delta determined", { delta });

        // Broadcast rendering state
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: true,
          text: "Loom AI is rendering elements directly onto your canvas...",
        });

        // 4. Apply nodes deletions
        for (const id of delta.nodeIdsToRemove) {
          flow.removeNode(id);
          logger.log(`Node removed: ${id}`);
        }

        // 5. Apply edges deletions
        for (const id of delta.edgeIdsToRemove) {
          flow.removeEdge(id);
          logger.log(`Edge removed: ${id}`);
        }

        // 6. Apply nodes modifications
        for (const update of delta.nodesToUpdate) {
          flow.updateNode(update.id, (node: any): any => {
            if (!node) return node;
            const nextData = { ...node.data };
            if (update.label !== undefined) nextData.label = update.label;
            if (update.color !== undefined) nextData.color = update.color;
            if (update.shape !== undefined) nextData.shape = update.shape;

            return {
              ...node,
              data: nextData,
              position: update.position ?? node.position,
              width: update.width ?? node.width,
              height: update.height ?? node.height,
            };
          });
          logger.log(`Node updated: ${update.id}`);
        }

        // 7. Apply nodes additions
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
              shape: node.shape,
            },
          } as any);
          logger.log(`Node added: ${node.id}`);
        }

        // 8. Apply edges additions
        for (const edge of delta.edgesToAdd) {
          flow.addEdge({
            id: edge.id,
            type: "canvasEdge",
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            data: edge.label ? { label: edge.label } : undefined,
          } as any);
          logger.log(`Edge added: ${edge.id}`);
        }

        // 9. Broadcast AI final reply as an ai-chat message to the room
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-chat",
          id: `ai-msg-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Loom AI",
            avatar: "",
            color: "#6457f9",
          },
          role: "assistant",
          content: delta.userExplanation,
          timestamp: new Date().toISOString(),
        });
      });

      // 10. Broadcast completed status (active: false)
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: false,
      });

      logger.log("Design agent execution complete");

      return {
        status: "success",
        runId: ctx.run.id,
      };
    } catch (error) {
      console.error("[DESIGN_AGENT_TASK]", error);

      // Reset the room's status banner to inactive in case of failure
      try {
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: false,
        });

        // Broadcast failure notification to room chat
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-chat",
          id: `ai-error-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Loom AI",
            avatar: "",
            color: "#6457f9",
          },
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error while trying to process your request. Please try again!`,
          timestamp: new Date().toISOString(),
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast error status", broadcastErr);
      }

      throw error;
    }
  },
});
