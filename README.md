# LLM Inference Orchestrator

## Overview

A production-style LLM orchestration system designed to handle:

- Asynchronous job ingestion
- Background processing via a dedicated worker service
- Retry with exponential backoff
- Dead-letter handling after max retries
- Idempotency protection for safe client retries
- Redis-backed distributed queue
- API and Worker process separation

This project simulates real-world LLM infrastructure constraints such as:

- External API instability
- Transient failures
- Client retry behavior
- Eventual consistency
- Distributed state coordination

---

## Architecture

Client → API Service → Redis Queue → Worker Service → Redis Job Store

**API Service**
- Stateless request ingestion
- Validates input
- Supports idempotency keys
- Exposes job status polling endpoint

**Worker Service**
- Independently consumes jobs from Redis
- Executes simulated LLM call
- Implements exponential backoff retry
- Dead-letters failed jobs
- Updates job state atomically

**Redis**
- Queue storage
- Job state persistence
- Idempotency key mapping
- Shared distributed coordination layer

---

## Features

- `POST /jobs` — Asynchronous job submission
- `GET /jobs/:id` — Job status polling
- Exponential backoff retry strategy
- Dead-letter behavior after max retries
- Idempotency via `x-idempotency-key`
- Separate API and Worker processes
- Redis-backed queue implementation
- Failure simulation for resilience testing

---

## Idempotency Handling

Clients may provide:
x-idempotency-key: <unique-key>


If the same idempotency key is reused, the system returns the original `jobId`
instead of creating duplicate jobs.

This prevents duplicate processing when clients retry due to network failures.

---

## Retry Strategy

- Random failure simulation (to mimic unstable LLM APIs)
- Exponential backoff:

  backoff = base_delay * (2 ^ retries)

- Maximum retry threshold enforced
- Failed jobs marked with `"status": "failed"`

---

## Run Locally

Ensure Redis is running locally.

Start API:

```bash
npm run dev

## Start Worker (in separate terminal):
npm run dev:worker

Example Flow
Submit Job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: unique-123" \
  -d '{"prompt":"Explain distributed systems"}'
Check Status
curl http://localhost:3000/jobs/<jobId>
Why This Project Exists

This system demonstrates:

Distributed systems thinking

Resilient job orchestration

Failure-aware backend architecture

Safe client retry handling

Service separation and horizontal scaling readiness

It models how production LLM infrastructure must behave under
real-world instability, retries, and concurrency.