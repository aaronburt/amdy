import cron from 'node-cron';
import { extractVariables } from './parser.js';
import { forward } from './forwarder.js';

export function registerPolling(proxies) {
  for (const proxy of proxies) {
    if (proxy.type === 'polling') {
      const { source, destination, schedule } = proxy;
      
      cron.schedule(schedule, async () => {
        console.log(`[POLLING TRIGGERED] Initiating poll for ${source.url}`);
        try {
          const sourceResponse = await fetch(source.url, {
            method: source.method || 'GET',
            headers: source.headers || {}
          });

          let data;
          const contentType = sourceResponse.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await sourceResponse.json();
          } else {
            data = await sourceResponse.text();
          }

          const responseHeaders = {};
          for (const [k, v] of sourceResponse.headers.entries()) {
            responseHeaders[k] = v;
          }

          const normalizedResponse = {
            body: data,
            headers: responseHeaders,
            status: sourceResponse.status
          };

          const variables = extractVariables(normalizedResponse, source.variables);
          console.log('[POLLING VARIABLES EXTRACTED]', variables);

          await forward(destination, variables);
        } catch (error) {
          console.error(`[POLLING ERROR] Failed to complete poll lifecycle for ${source.url}: ${error.message}`);
        }
      });
      console.log(`[POLLING REGISTERED] Scheduled cron job [${schedule}] for polling ${source.url}`);
    }
  }
}
