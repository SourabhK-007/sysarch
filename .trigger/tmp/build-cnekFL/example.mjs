import {
  logger,
  task,
  wait
} from "./chunk-5MZFGH3M.mjs";
import "./chunk-TZ5SZRRN.mjs";
import {
  __name,
  init_esm
} from "./chunk-Z6TFXI5D.mjs";

// trigger/example.ts
init_esm();
var helloWorldTask = task({
  id: "hello-world",
  // Optional: limit how long this task can run
  maxDuration: 300,
  // 5 minutes
  run: /* @__PURE__ */ __name(async (payload, { ctx }) => {
    const message = payload.message ?? "Hello from Loom AI!";
    logger.log("Task started", { message, runId: ctx.run.id });
    await wait.for({ seconds: 2 });
    logger.log("Task complete", { message });
    return { message, success: true };
  }, "run")
});
export {
  helloWorldTask
};
//# sourceMappingURL=example.mjs.map
