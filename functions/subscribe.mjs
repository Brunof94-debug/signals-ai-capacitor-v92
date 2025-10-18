// functions/subscribe.mjs
import { getStore } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return res204();

  const origin = event.headers.origin || '*';
  const store = getStore('push-subs', { consistency: 'strong' });

  try {
    if (event.httpMethod === 'GET') {
      const { keys = [] } = await store.list();
      return resJson({ ok: true, count: keys.length }, origin);
    }

    if (event.httpMethod !== 'POST') {
      return resJson({ ok: false, error: 'Method not allowed' }, origin, 405);
    }

    const body = JSON.parse(event.body || '{}');
    if (!body?.endpoint) {
      return resJson({ ok: false, error: 'Invalid subscription' }, origin, 400);
    }

    // usamos o endpoint como chave
    await store.set(body.endpoint, JSON.stringify(body));

    return resJson({ ok: true }, origin);
  } catch (e) {
    return resJson({ ok: false, error: e.message || 'subscribe failed' }, origin, 500);
  }
}

/* helpers */
function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function res204(origin='*') {
  return { statusCode: 204, headers: cors(origin) };
}
function resJson(obj, origin='*', status=200) {
  return { statusCode: status, headers: cors(origin), body: JSON.stringify(obj) };
}
