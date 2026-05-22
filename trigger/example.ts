import { logger, task, wait } from "@trigger.dev/sdk";

/**
 * Hello World — smoke-test task to verify Trigger.dev is wired up correctly.
 * Test this from the Trigger.dev dashboard → Test tab.
 * Delete or replace with real tasks once connection is confirmed.
 */
export const helloWorldTask = task({
  id: "hello-world",
  // Optional: limit how long this task can run
  maxDuration: 300, // 5 minutes

  run: async (payload: { message?: string }, { ctx }) => {
    const message = payload.message ?? "Hello from Loom AI!";

    logger.log("Task started", { message, runId: ctx.run.id });

    // Simulate a short async operation
    await wait.for({ seconds: 2 });

    logger.log("Task complete", { message });

    return { message, success: true };
  },
});
