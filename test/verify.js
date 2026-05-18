import axios from 'axios';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('[VERIFIER] Waiting 3 seconds for servers to initialize...');
  await wait(3000);

  console.log('[VERIFIER] Sending test webhook (push model) payload...');
  const webhookPayload = {
    event: {
      data: {
        new_state: {
          attributes: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        },
        entity_id: "device_tracker.iphone_aaron"
      }
    }
  };

  try {
    const res = await fetch('http://127.0.0.1:3000/webhook/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });
    const data = await res.json();
    console.log('[VERIFIER] Webhook Response Status:', res.status);
    console.log('[VERIFIER] Webhook Response Body:', data);
  } catch (error) {
    console.error('[VERIFIER] Webhook Request Failed:', error.message);
  }

  console.log('[VERIFIER] Waiting 10 seconds to allow cron poll cycles to trigger...');
  await wait(10000);

  console.log('[VERIFIER] Verification runs completed.');
}

run().catch(console.error);
