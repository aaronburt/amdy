FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
RUN npx esbuild src/index.js --bundle --platform=node --format=esm --outfile=dist/index.mjs --external:fsevents --banner:js="import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);"

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/dist/index.mjs ./index.mjs
CMD ["index.mjs"]
