# LLM Inference Orchestrator

## Overview

LLM Inference Orchestrator is a production-style backend system that
models real-world LLM infrastructure patterns:

-   Asynchronous job ingestion
-   Background worker processing
-   Retry with exponential backoff
-   Dead-letter handling
-   Idempotency protection
-   Redis-backed distributed queue
-   API and Worker process separation

This project demonstrates how resilient LLM infrastructure should behave
under instability, retries, and concurrency.

------------------------------------------------------------------------

## Architecture

Client → API Service → Redis Queue → Worker Service → Redis Job Store

### API Service

-   Stateless request ingestion
-   Input validation
-   Idempotency key support
-   Job status polling endpoint

### Worker Service

-   Consumes jobs from Redis
-   Simulates or executes LLM calls
-   Retries failed jobs with exponential backoff
-   Dead-letters after max retries
-   Updates job state atomically

### Redis

-   Queue storage
-   Job persistence
-   Idempotency key mapping
-   Shared distributed coordination layer

------------------------------------------------------------------------

## Features

-   `POST /jobs` --- Submit job asynchronously
-   `GET /jobs/:id` --- Poll job status
-   Exponential backoff retry strategy
-   Dead-letter after max retries
-   Idempotency via `x-idempotency-key`
-   API and Worker process separation
-   Redis-backed queue implementation
-   Failure simulation for resilience testing

------------------------------------------------------------------------

## API Reference

### Submit Job

``` bash
curl -X POST http://localhost:3000/jobs   -H "Content-Type: application/json"   -H "x-idempotency-key: unique-123"   -d '{"prompt":"Explain distributed systems"}'
```

Response:

``` json
{
  "jobId": "uuid-v4",
  "status": "queued"
}
```

------------------------------------------------------------------------

### Check Job Status

``` bash
curl http://localhost:3000/jobs/<jobId>
```

Queued response:

``` json
{
  "id": "uuid",
  "status": "queued"
}
```

Completed response:

``` json
{
  "id": "uuid",
  "status": "completed",
  "result": {
    "response": "LLM response..."
  }
}
```

Failed response:

``` json
{
  "id": "uuid",
  "status": "failed",
  "error": "Max retries exceeded"
}
```

------------------------------------------------------------------------

## Idempotency

Clients may provide:

    x-idempotency-key: <unique-key>

If the same key is reused, the system returns the original `jobId`
instead of creating duplicate jobs.

This guarantees safe retries when clients experience timeouts or network
failures.

------------------------------------------------------------------------

## Retry Strategy

-   Random failure simulation (to mimic unstable LLM APIs)
-   Exponential backoff formula:

```{=html}
<!-- -->
```
    backoff = base_delay * (2 ^ retries)

-   Maximum retry threshold enforced
-   Failed jobs marked with `"status": "failed"`

------------------------------------------------------------------------

## Run Locally

Ensure Redis is running locally.

Start API:

``` bash
npm run dev
```

Start Worker (in separate terminal):

``` bash
npm run dev:worker
```

------------------------------------------------------------------------

## Production Considerations

-   Run multiple worker replicas for horizontal scaling
-   Use Redis persistence appropriately
-   Add authentication and rate limiting
-   Monitor queue length and retry metrics
-   Add cost tracking when integrating real LLM providers

------------------------------------------------------------------------

## Why This Project Exists

This repository demonstrates:

-   Distributed systems thinking
-   Resilient job orchestration
-   Failure-aware backend design
-   Safe client retry handling
-   Service separation and scaling readiness

It models how production LLM infrastructure should be built --- not just
how to call an LLM API.

------------------------------------------------------------------------

## License

MIT
