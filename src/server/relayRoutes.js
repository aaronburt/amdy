import { executePoll } from '../engine/scheduler.js';

export function registerRelayRoutes(app, proxies) {
  for (const proxy of proxies) {
    if (proxy.type === 'relay') {
      const { source, destination } = proxy;
      const path = source.path;

      app.get(path, async (request, reply) => {
        try {
          const result = await executePoll(source, destination);
          return reply.status(200).send({
            success: true,
            message: 'Relay completed successfully',
            variables: result.variables
          });
        } catch (error) {
          return reply.status(502).send({
            success: false,
            error: 'Relay failed',
            message: error.message
          });
        }
      });
    }
  }
}
