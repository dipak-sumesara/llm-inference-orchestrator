import Fastify from "fastify";
import dotenv from "dotenv";

import { enqueueJob } from "./queue/jobQueue";

import { startWorker } from "./workers/llmWorker";

import redis from "./cache/redis";

dotenv.config();

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.post("/jobs", async (request, reply) => {
  const body = request.body as any;
  const idempotencyKey = request.headers["x-idempotency-key"] as string;

  if (!body || !body.prompt) {
    return reply.status(400).send({
      error: "Prompt is required",
    });
  }

  const jobId = await enqueueJob(
    { prompt: body.prompt },
    idempotencyKey
  );

  return {
    jobId,
    status: "queued",
  };
});

app.get("/jobs/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const job = await redis.get(`llm:job:${id}`);

  if (!job) {
    return reply.status(404).send({
      error: "Job not found",
    });
  }

  return JSON.parse(job);
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("LLM Inference Orchestrator running on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();