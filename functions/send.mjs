import webpush from 'web-push';
import { getStore } from '@netlify/blobs';

const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
const BLOBS_TOKEN = process.env.NETLIFY_BLOBS_TOKEN;

const {
  WEB_PUSH_VAPID_PUBLIC,
  WEB_PUSH_VAPID_PRIVATE,
  WEB_PUSH_CONTACT = 'mailto:admin@example.com',
} = process.env;

webpush.setVapidDetails(
  WEB_PUSH_CONTACT,
  WEB_PUSH_VAPID_PUBLIC,
  WEB_PUSH_VAPID_PRIVATE
);

function makeStore() {
  if (!BLOBS_TOKEN) throw new Error('NETLIFY_BLOBS_TOKEN ausente');
  if (!SITE_ID) throw new Error('SITE_ID ausente');
  return getStore('push-subs', {
    consistency: 'strong',
    siteID: SITE_ID,
    token: BLOBS_TOKEN,
  });
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return res204();
  const origin = event.headers.origin || '*';

  try {
    const store = makeStore();
    const { keys = [] } = await store.list();

    let sent = 0, failed = 0;
    for (const k of keys) {
      try {
        const subStr = await store.get(k.name);
        if (!subStr) continue;
        const sub = JSON.parse(subStr);

        const payload = JSON.stringify({
          title: 'Signals AI',
          body: 'Novo sinal BTC disponível',
          url: '/',
        });

        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) {
          await store.delete(k.name);
        }
      }
    }

    return resJson({ ok: true, total: keys.length, sent, failed }, origin);

  } catch (e) {
    return resJson({ ok: false, error: e.message }, origin, 500);
  }
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function res204(origin='*') { return { statusCode: 204, headers: cors(origin) }; }
function resJson(obj, origin='*', status=200) {
  return { statusCode: status, headers: cors(origin), body: JSON.stringify(obj) };
}
