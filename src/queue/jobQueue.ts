import redis from "../cache/redis";
import { v4 as uuidv4 } from "uuid";

const QUEUE_KEY = "llm:jobs";

export async function enqueueJob(payload: any, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existingJobId = await redis.get(
      `llm:idempotency:${idempotencyKey}`
    );

    if (existingJobId) {
      return existingJobId;
    }
  }

  const jobId = uuidv4();

  const job = {
    id: jobId,
    status: "queued",
    payload,
    createdAt: Date.now(),
    retries: 0,
  };

  await redis.rpush(QUEUE_KEY, JSON.stringify(job));
  await redis.set(`llm:job:${jobId}`, JSON.stringify(job));

  if (idempotencyKey) {
    await redis.set(
      `llm:idempotency:${idempotencyKey}`,
      jobId
    );
  }

  return jobId;
}

export async function dequeueJob() {
  const jobData = await redis.lpop(QUEUE_KEY);
  if (!jobData) return null;

  return JSON.parse(jobData);
}