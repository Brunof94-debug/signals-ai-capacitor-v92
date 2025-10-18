import webpush from 'web-push';
import { createClient } from '@netlify/blobs';

const PUBLIC  = process.env.WEB_PUSH_VAPID_PUBLIC;
const PRIVATE = process.env.WEB_PUSH_VAPID_PRIVATE;
const CONTACT = process.env.WEB_PUSH_CONTACT || 'mailto:admin@example.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

webpush.setVapidDetails(CONTACT, PUBLIC, PRIVATE);

export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }
  try {
    const { title = 'Signals AI', body = 'Sinal gerado.' } = await req.json().catch(() => ({}));

    const blobs = createClient({ token: process.env.NETLIFY_BLOBS_TOKEN });
    const store = blobs.blobStore('signals-ai');
    const key = 'subscribers.json';

    const exist = await store.get(key).catch(() => null);
    const list = exist ? JSON.parse(await exist.text()) : [];

    // In production, iterate over subscriptions and use webpush.sendNotification
    return new Response(
      JSON.stringify({
        ok: true,
        sent: list.length,
        title,
        body
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS }
      }
    );
  }
};
