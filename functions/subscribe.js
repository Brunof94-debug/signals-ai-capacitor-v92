import { createClient } from '@netlify/blobs';

export default async () => {
  try {
    // Aqui você poderia receber token do app nativo também (via body JSON)
    const blobs = createClient({ token: process.env.NETLIFY_BLOBS_TOKEN });
    const store = blobs.blobStore('signals-ai');
    const key = 'subscribers.json';

    const exist = await store.get(key).catch(()=>null);
    const list = exist ? JSON.parse(await exist.text()) : [];

    // Demo: guardamos apenas um marcador para validar fluxo
    if(!list.find(x=>x === 'web-demo')) list.push('web-demo');

    await store.setJSON(key, list);
    return new Response(JSON.stringify({ ok:true, count:list.length }), { status:200 });
  } catch(e) {
    return new Response(JSON.stringify({ ok:false, error:e.message }), { status:500 });
  }
}
