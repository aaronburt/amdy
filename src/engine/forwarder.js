import { interpolate } from './parser.js';
import { relayStore } from './relayStore.js';

export async function forward(destinationConfig, variables) {
  const url = interpolate(destinationConfig.url, variables);
  const method = destinationConfig.method || 'POST';
  const headers = interpolate(destinationConfig.headers || {}, variables);
  const query = interpolate(destinationConfig.query || {}, variables);
  const body = interpolate(destinationConfig.body || {}, variables);

  if (url.startsWith('relay://')) {
    const key = url.replace('relay://', '');
    const data = Object.keys(body).length > 0 ? body : (Object.keys(query).length > 0 ? query : variables);
    await relayStore.set(key, data);
    console.log(`[RELAY SUCCESS] Data stored in local relay for key: ${key}`);
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  }

  const urlObj = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    urlObj.searchParams.append(k, v);
  }

  const fetchOptions = {
    method: method.toUpperCase(),
    headers: headers
  };

  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    fetchOptions.body = JSON.stringify(body);
    if (!fetchOptions.headers['Content-Type']) {
      fetchOptions.headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(urlObj.toString(), fetchOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    console.log(`[FORWARD SUCCESS] [${method}] ${url} -> Status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[FORWARD ERROR] [${method}] ${url} -> Message: ${error.message}`);
    throw error;
  }
}

