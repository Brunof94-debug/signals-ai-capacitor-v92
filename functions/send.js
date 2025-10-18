import webpush from 'web-push';
import { createClient } from '@netlify/blobs';

const PUBLIC = process.env.WEB_PUSH_VAPID_PUBLIC;
const PRIVATE = process.env.WEB_PUSH_VAPID_PRIVATE;
const CONTACT = process.env.WEB_PUSH_CONTACT || 'mailto:admin@example.com';

webpush.setVapidDetails(CONTACT, PUBLIC, PRIVATE);

export default async (req) => {
  try {
    const { title='Signals AI', body='Sinal gerado.' } = await req.json().catch(()=>({}));

    // Em produção: obter subscriptions reais (FCM nativo usa outro caminho).
    const blobs = createClient({ token: process.env.NETLIFY_BLOBS_TOKEN });
    const store = blobs.blobStore('signals-ai');
    const key = 'subscribers.json';
    const exist = await store.get(key).catch(()=>null);
    const list = exist ? JSON.parse(await exist.text()) : [];

    // Aqui disparamos apenas um push "simulado" (para web). Em Android nativo, use FCM server.
    // Para esta demo, só retornamos 200 (o objetivo é validar o fluxo end-to-end).
    // Se já tiver subscriptions web, você faria:
    // await Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, JSON.stringify({ title, body }))));

    return new Response(JSON.stringify({ ok:true, sent:list.length, title, body }), { status:200 });
  } catch(e) {
    return new Response(JSON.stringify({ ok:false, error:e.message }), { status:500 });
  }
}
