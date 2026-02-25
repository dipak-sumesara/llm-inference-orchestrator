import redis from "../cache/redis";
import { dequeueJob } from "../queue/jobQueue";

const PROCESSING_DELAY = 1500;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

async function simulateLLMCall(prompt: string) {
  // Simulate random failure (30%)
  if (Math.random() < 0.3) {
    throw new Error("Simulated LLM API failure");
  }

  await new Promise((res) => setTimeout(res, PROCESSING_DELAY));

  return `LLM response for: ${prompt}`;
}

async function processJob(job: any) {
  console.log("Processing job:", job.id);

  try {
    const response = await simulateLLMCall(job.payload.prompt);

    const result = {
      response,
      processedAt: Date.now(),
    };

    await redis.set(
      `llm:job:${job.id}`,
      JSON.stringify({
        ...job,
        status: "completed",
        result,
      })
    );

    console.log("Completed job:", job.id);
  } catch (err) {
    const retries = job.retries || 0;

    if (retries < MAX_RETRIES) {
      const backoff = BACKOFF_BASE_MS * Math.pow(2, retries);

      console.log(
        `Retrying job ${job.id} in ${backoff}ms (attempt ${retries + 1})`
      );

      setTimeout(async () => {
        await redis.rpush(
          "llm:jobs",
          JSON.stringify({
            ...job,
            retries: retries + 1,
          })
        );
      }, backoff);
    } else {
      console.log("Dead-lettering job:", job.id);

      await redis.set(
        `llm:job:${job.id}`,
        JSON.stringify({
          ...job,
          status: "failed",
          error: "Max retries exceeded",
        })
      );
    }
  }
}

export async function startWorker() {
  console.log("LLM Worker started...");

  while (true) {
    const job = await dequeueJob();

    if (job) {
      await processJob(job);
    } else {
      await new Promise((res) => setTimeout(res, 500));
    }
  }
}