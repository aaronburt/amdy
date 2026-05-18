# Dynamic API Proxy and Webhook/Polling Service

A lightweight, modular, and highly configurable API Proxy service designed for Windows 11. It supports both incoming webhooks (push model) and cron-scheduled polling targets (pull model) via a single unified JSON configuration schema, executing completely dependency-free using modern Node.js native features.

## Project Structure

```text
Amdy/
├── config/
│   └── config.json
├── src/
│   ├── index.js          (entry point and main runner)
│   ├── engine/
│   │   ├── forwarder.js  (dynamic target request forwarder using fetch)
│   │   ├── parser.js     (interpolation & lodash variable extraction)
│   │   └── scheduler.js  (cron-based pull orchestration using node-cron)
│   └── server/
│       └── webhooks.js   (fastify webhook routing definitions)
├── test/
│   ├── mock-server.js    (mock API server for local testing)
│   └── verify.js         (automated integration verify runner)
└── package.json
```

## Setup and Installation

Install dependencies:
```bash
npm install
```

## Running the Application

### 1. Start the API Proxy Server
```bash
npm run start
```
Starts the API gateway on default port `3000`.

### 2. Start the Mock Test Server
```bash
npm run mock
```
Launches mock external APIs (dependencies) on port `4000`.

### 3. Run the Verification Client
```bash
npm run test
```
Sends a mock webhook payload and waits to trace the cron scheduler loops.

## Running in Docker (Production)

To build and run the secure, lightweight distroless container using Docker Compose:

```bash
docker compose up -d --build
```

The configuration is mounted dynamically from `./config` as a read-only volume, meaning you can update the routing mappings on the host directly, and the service will update instantly upon process reload.
