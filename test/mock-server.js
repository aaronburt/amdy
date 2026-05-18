import fastify from 'fastify';

const app = fastify({ logger: false });

app.get('/api/source/status', async (request, reply) => {
  console.log('[MOCK SOURCE] Status polled by service');
  return reply
    .header('Authorization', 'Bearer mock_auth_token_value')
    .status(200)
    .send({
      status: {
        system: "operational",
        uptime: 98765
      }
    });
});

app.get('/api/target/location', async (request, reply) => {
  console.log('[MOCK TARGET] Received Location via GET query:', request.query);
  return reply.status(200).send({ ok: true });
});

app.post('/api/target/status-update', async (request, reply) => {
  console.log('[MOCK TARGET] Received Status Update via POST body:', request.body);
  return reply.status(200).send({ ok: true });
});

async function start() {
  await app.listen({ port: 4000, host: '0.0.0.0' });
  console.log('[MOCK SERVER] External dependencies mock server listening on port 4000');
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
