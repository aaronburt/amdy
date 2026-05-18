const ws = new WebSocket('ws://localhost:3000/relay/status_relay/stream');

ws.onopen = () => {
  console.log('[WS TEST CLIENT] Connected to stream');
};

ws.onmessage = (event) => {
  console.log('[WS TEST CLIENT] Received message:', event.data);
  const parsed = JSON.parse(event.data);
  if (parsed.event === 'initial') {
    setTimeout(async () => {
      console.log('[WS TEST CLIENT] Triggering manual mutation...');
      const response = await fetch('http://localhost:3000/relay/status_relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'WS_UPDATED_STATE', up: '99999' })
      });
      console.log('[WS TEST CLIENT] Mutation response:', response.status);
    }, 1000);
  } else if (parsed.event === 'update' && parsed.data.state === 'WS_UPDATED_STATE') {
    console.log('[WS TEST CLIENT] Success! Real-time mutation push received.');
    ws.close();
    process.exit(0);
  }
};

ws.onerror = (err) => {
  console.error('[WS TEST CLIENT] Error:', err);
  process.exit(1);
};
