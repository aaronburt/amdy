import { z } from 'zod';

const ProxySchema = z.object({
  type: z.enum(['webhook', 'polling', 'relay']),
  schedule: z.string().optional(),
  source: z.object({
    path: z.string().optional(),
    url: z.string().optional(),
    method: z.string().optional(),
    headers: z.record(z.string()).optional(),
    variables: z.record(z.string()).optional()
  }),
  destination: z.object({
    url: z.string(),
    method: z.string().optional(),
    query: z.record(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    body: z.record(z.any()).optional()
  })
}).refine(data => {
  if (data.type === 'webhook') {
    return typeof data.source.path === 'string' && data.source.path.startsWith('/');
  }
  if (data.type === 'polling') {
    return typeof data.source.url === 'string' && typeof data.schedule === 'string';
  }
  if (data.type === 'relay') {
    return typeof data.source.path === 'string' && data.source.path.startsWith('/') && typeof data.source.url === 'string';
  }
  return false;
}, {
  message: "Webhook requires source.path. Polling requires source.url and schedule. Relay requires source.path and source.url."
});

export const ConfigSchema = z.object({
  enableTesting: z.boolean().default(false).optional(),
  proxies: z.array(ProxySchema)
});
