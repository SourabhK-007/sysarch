import { logger, task } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

interface SpecGeneratorPayload {
  projectId: string;
  roomId: string;
  userId: string;
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
 * System Prompt guiding Gemini to generate a technical specification.
 */
const SYSTEM_PROMPT = `You are Loom AI, an expert software systems architect.
Your task is to analyze a 2D systems architecture canvas graph consisting of nodes and edges, and generate a comprehensive, highly professional, production-grade technical specification in Markdown format.

The document should be beautifully styled and detailed, including:
1. Executive Summary & Goals: A high-level overview of what this system accomplishes and its business/technical goals.
2. System Architecture Topology: A description of the architecture style (e.g. Microservices, Event-Driven) and an explanation of the layout.
3. Component Breakdown: Detailed descriptions of each node present in the canvas. Include their shape, role, and their function in the system.
4. Data Flow & Communication: Detail how data moves between components based on the edges and their labels/directions.
5. Technical Recommendations: Offer concrete architectural recommendations for security, scalability, performance, and monitoring tailored to this design.

Write in a clean, developer-centric, professional tone. Render beautiful markdown tables, clean sections, and well-structured lists. Do NOT include markdown code blocks around the entire output, just start directly with the markdown content (e.g., "# Technical Specification").`;

export const specGeneratorTask = task({
  id: "spec-generator",

  run: async (payload: SpecGeneratorPayload, { ctx }) => {
    logger.log("Spec generator execution started", {
      runId: ctx.run.id,
      projectId: payload.projectId,
      roomId: payload.roomId,
    });

    try {
      // 1. Broadcast start status to the room
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: true,
        text: "Loom AI is reading your canvas components...",
      });

      // 2. Load project name from Prisma
      const project = await prisma.project.findUnique({
        where: { id: payload.projectId },
      });
      const projectName = project?.name || "System Design Workspace";

      // 3. Open Room Storage, pull current canvas state
      let currentNodes: readonly any[] = [];
      let currentEdges: readonly any[] = [];

      await mutateFlow({ client: liveblocks, roomId: payload.roomId }, async (flow) => {
        currentNodes = flow.nodes || [];
        currentEdges = flow.edges || [];
      });

      logger.log("Active canvas snapshot pulled", {
        nodeCount: currentNodes.length,
        edgeCount: currentEdges.length,
      });

      // Broadcast progress state
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: true,
        text: "Loom AI is analyzing system topology & drafting specification...",
      });

      // 4. Construct AI prompt
      const userPrompt = `Project Name: "${projectName}"
Existing Nodes: ${JSON.stringify(
        currentNodes.map((n) => {
          const data = n.data as any;
          return {
            id: n.id,
            label: data?.label,
            color: data?.color,
            shape: data?.shape,
            position: n.position,
          };
        })
      )}
Existing Edges: ${JSON.stringify(
        currentEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label,
        }))
      )}`;

      // 5. Invoke Gemini to generate markdown text
      const { text: specMarkdown } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });

      logger.log("LLM specification draft completed", {
        markdownLength: specMarkdown.length,
      });

      // Broadcast upload state
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: true,
        text: "Loom AI is saving your system specification...",
      });

      // 6. Upload Markdown content to Vercel Blob
      const specId = `spec-${Date.now()}`;
      const filename = `specs/${payload.projectId}/${specId}.md`;

      const blob = await put(filename, specMarkdown, {
        access: "private",
        contentType: "text/markdown",
        addRandomSuffix: true,
      });

      logger.log("Spec persisted to Vercel Blob", { blobUrl: blob.url });

      // 7. Store the ProjectSpec record in PostgreSQL via Prisma
      const specRecord = await prisma.projectSpec.create({
        data: {
          projectId: payload.projectId,
          filePath: blob.url,
        },
      });

      logger.log("Spec metadata persisted in database", { specId: specRecord.id });

      // 8. Broadcast spec-completed event to room collaborators
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-chat",
        id: `ai-msg-spec-${Math.random().toString(36).substring(7)}`,
        sender: {
          name: "Loom AI",
          avatar: "",
          color: "#6457f9",
        },
        role: "assistant",
        content: `🎉 **Technical Specification Generated Successfully!**

I have compiled a comprehensive system architecture spec from your canvas. You can now preview and download it from the **Specs** tab above.`,
        timestamp: new Date().toISOString(),
      });

      // 9. Broadcast completed status (active: false)
      await liveblocks.broadcastEvent(payload.roomId, {
        feed: "ai-status-feed",
        active: false,
      });

      logger.log("Spec generator execution complete");

      return {
        status: "success",
        runId: ctx.run.id,
        specId: specRecord.id,
      };
    } catch (error) {
      console.error("[SPEC_GENERATOR_TASK]", error);

      // Reset the room's status banner to inactive in case of failure
      try {
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-status-feed",
          active: false,
        });

        // Broadcast failure notification to room chat
        await liveblocks.broadcastEvent(payload.roomId, {
          feed: "ai-chat",
          id: `ai-error-spec-${Math.random().toString(36).substring(7)}`,
          sender: {
            name: "Loom AI",
            avatar: "",
            color: "#6457f9",
          },
          role: "assistant",
          content: `⚠️ Sorry, I encountered an error while trying to generate the system specification. Please try again!`,
          timestamp: new Date().toISOString(),
        });
      } catch (broadcastErr) {
        console.error("Failed to broadcast spec error status", broadcastErr);
      }

      throw error;
    }
  },
});
