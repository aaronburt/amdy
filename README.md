# Amdy: Dynamic API Proxy & Webhook/Polling Service

A lightweight, platform-agnostic, and highly configurable API Proxy service designed to run seamlessly in any Docker or Node.js environment. It supports incoming webhooks (push model), cron-scheduled polling targets (pull model), a persistent local relay datastore with real-time WebSocket streaming, and automated configuration initialization.

## Key Features

- **Platform-Agnostic Dockerization**: Run anywhere with a microscopic production footprint (~1.8MB bundle running on Google Distroless Node.js).
- **Persistent Local Relay (`relay://`)**: Store poll or webhook payloads locally in an in-memory cache synchronized automatically to a local JSON cache file.
- **Real-Time WebSocket Streams**: Subscribe to instant mutation updates on specific relay keys via `ws://localhost:3000/relay/:key/stream`.
- **Zod Schema Verification**: Configuration structure and parameters are strictly validated at startup.
- **Auto-Initialization**: Missing directories and configuration files are dynamically created with secure default schemas on startup.

---

## Project Structure

```text
Amdy/
├── config/
│   └── config.json       (JSON route and target mappings)
├── src/
│   ├── index.js          (Server entry point, Fastify, and WebSocket router)
│   ├── engine/
│   │   ├── forwarder.js  (Relay and HTTP forwarding resolver)
│   │   ├── parser.js     (Native property path extractor and string interpolator)
│   │   ├── relayStore.js (Persistent cache datastore with EventEmitter updates)
│   │   ├── scheduler.js  (Cron polling orchestrator)
│   │   └── schema.js     (Zod configuration rules)
│   └── server/
│       └── webhooks.js   (Dynamic webhook route register)
├── test/
│   ├── mock-server.js    (Local target mock API for verification)
│   ├── verify.js         (HTTP integration test suite)
│   └── ws-verify.js      (WebSocket push E2E verification test)
└── package.json
```

---

## Setup and Installation

Install dependencies locally:
```bash
npm install
```

---

## Running Locally

### 1. Start the API Proxy
```bash
npm run start
```
Starts the API gateway on port `3000`. If `config/config.json` is missing, it will automatically initialize a default schema.

### 2. Start Mock Testing Suite
Launch the mock external API server on port `4000`:
```bash
npm run mock
```

Run integration and WebSocket verification tests:
```bash
npm run test
node test/ws-verify.js
```

---

## Running in Docker

To build and run the secure, lightweight compiled bundle using Docker Compose:

```bash
docker compose up -d --build
```

The configuration is mounted dynamically from `./config` on the host to `/app/config` in the container.
