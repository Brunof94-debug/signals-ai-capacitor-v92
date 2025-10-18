import { createClient } from '@netlify/blobs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }

  try {
    // Here you could parse token or subscription from body
    const blobs = createClient({ token: process.env.NETLIFY_BLOBS_TOKEN });
    const store = blobs.blobStore('signals-ai');
    const key = 'subscribers.json';

    const exist = await store.get(key).catch(() => null);
    const list = exist ? JSON.parse(await exist.text()) : [];

    if (!list.find((x) => x === 'web-demo')) list.push('web-demo');

    await store.setJSON(key, list);
    return new Response(JSON.stringify({ ok: true, count: list.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS }
    });
  }
};
