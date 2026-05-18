import fastify from 'fastify';
import { readFile } from 'fs/promises';
import { registerWebhooks } from './server/webhooks.js';
import { registerPolling } from './engine/scheduler.js';
import { ConfigSchema } from './engine/schema.js';
import { relayStore } from './engine/relayStore.js';
import fastifyWebsocket from '@fastify/websocket';

const app = fastify({ logger: false });

async function start() {
  await relayStore.init();
  const configFile = await readFile('./config/config.json', 'utf-8');
  const parsedConfig = JSON.parse(configFile);
  const { proxies, enableTesting } = ConfigSchema.parse(parsedConfig);

  await app.register(fastifyWebsocket);

  app.get('/relay/:key/stream', { websocket: true }, (connection, req) => {
    const { key } = req.params;
    if (relayStore.has(key)) {
      connection.socket.send(JSON.stringify({ event: 'initial', data: relayStore.get(key) }));
    }
    const listener = (data) => {
      connection.socket.send(JSON.stringify({ event: 'update', data }));
    };
    relayStore.on(key, listener);
    connection.socket.on('close', () => {
      relayStore.off(key, listener);
    });
  });

  app.get('/relay/:key', async (request, reply) => {
    const { key } = request.params;
    if (relayStore.has(key)) {
      return reply.status(200).send(relayStore.get(key));
    }
    return reply.status(404).send({ error: 'Not Found', message: `No relayed data found for key: ${key}` });
  });

  app.post('/relay/:key', async (request, reply) => {
    if (!enableTesting) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Manual relay updates are disabled. Set enableTesting: true to enable.' });
    }
    const { key } = request.params;
    await relayStore.set(key, request.body);
    return reply.status(200).send({ success: true, message: `Relay key ${key} updated` });
  });

  registerWebhooks(app, proxies);
  registerPolling(proxies);

  const port = process.env.PORT || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[SERVER START] API Proxy service listening on port ${port}`);
}

(async () => {
  try {
    await start();
  } catch (err) {
    if (err.name === 'ZodError') {
      console.error('[CRITICAL FAILURE] Configuration Validation Failed:', err.errors);
    } else {
      console.error('[CRITICAL FAILURE]', err);
    }
    process.exit(1);
  }
})();
