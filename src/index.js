import fastify from 'fastify';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { registerWebhooks } from './server/webhooks.js';
import { registerPolling } from './engine/scheduler.js';
import { ConfigSchema } from './engine/schema.js';
import { relayStore } from './engine/relayStore.js';
import fastifyWebsocket from '@fastify/websocket';

const app = fastify({ logger: false });

async function start() {
  await relayStore.init();
  const configDir = './config';
  const configPath = `${configDir}/config.json`;
  try {
    await mkdir(configDir, { recursive: true });
  } catch (err) {}
  let configFile;
  try {
    configFile = await readFile(configPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      const defaultConfig = {
        enableTesting: false,
        proxies: []
      };
      await writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      configFile = JSON.stringify(defaultConfig);
      console.log(`[CONFIG INITIALIZED] Created default configuration file at ${configPath}`);
    } else {
      throw err;
    }
  }
  const parsedConfig = JSON.parse(configFile);
  const { proxies, enableTesting } = ConfigSchema.parse(parsedConfig);

  await app.register(fastifyWebsocket);

  const haProxy = proxies.find(p => p.source?.url?.includes('ha.aaronburt.co.uk'));
  const haToken = haProxy?.source?.headers?.['Authorization'] || haProxy?.source?.headers?.['authorization'];

  app.get('/relay-stream/*', { websocket: true }, (connection, req) => {
    const key = req.params['*'];
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

  app.get('/relay/*', async (request, reply) => {
    const key = request.params['*'];
    if (!relayStore.has(key) && key.startsWith('home/') && haToken) {
      const entity = key.replace('home/', '');
      try {
        const response = await fetch(`https://ha.aaronburt.co.uk/api/states/${entity}`, {
          headers: {
            'Authorization': haToken,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          const location = {
            latitude: data.attributes?.latitude,
            longitude: data.attributes?.longitude,
            state: data.state
          };
          await relayStore.set(key, location);
        }
      } catch (err) {
        console.error(`[DYNAMIC RESOLVER ERROR] Failed to fetch state for ${entity}:`, err.message);
      }
    }

    if (relayStore.has(key)) {
      return reply.status(200).send(relayStore.get(key));
    }
    return reply.status(404).send({ error: 'Not Found', message: `No relayed data found for key: ${key}` });
  });

  app.post('/relay/*', async (request, reply) => {
    if (!enableTesting) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Manual relay updates are disabled. Set enableTesting: true to enable.' });
    }
    const key = request.params['*'];
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
