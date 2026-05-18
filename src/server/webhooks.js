import { extractVariables } from '../engine/parser.js';
import { forward } from '../engine/forwarder.js';

export function registerWebhooks(app, proxies) {
  for (const proxy of proxies) {
    if (proxy.type === 'webhook') {
      const { source, destination } = proxy;
      const method = (source.method || 'POST').toLowerCase();
      
      app[method](source.path, async (request, reply) => {
        console.log(`[WEBHOOK INBOUND] Received ${request.method} on ${request.url}`);
        
        const variables = extractVariables(request, source.variables);
        console.log('[VARIABLES EXTRACTED]', variables);

        try {
          await forward(destination, variables);
          return reply.status(200).send({ success: true, message: 'Payload transformed and forwarded' });
        } catch (error) {
          return reply.status(502).send({ success: false, error: 'Forwarding failed', message: error.message });
        }
      });
      console.log(`[ROUTE REGISTERED] Webhook listener registered for [${method.toUpperCase()}] ${source.path}`);
    }
  }
}
