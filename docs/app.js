
import { rsi } from './lib/ta.js';
const $ = (q)=>document.querySelector(q);
const logs = $('#logs');
const tblBody = $('#tblSignals tbody');
let loop = null; let beforeInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); beforeInstallPrompt = e; $('#btnInstall').disabled=false; });
$('#btnInstall').onclick = async()=>{ if(beforeInstallPrompt) beforeInstallPrompt.prompt(); };
function log(line){ logs.textContent += "\n"+line; logs.scrollTop = logs.scrollHeight; }
function setStatus(s){ $('#status').textContent = s; }

async function fetchKlines(symbol, interval, limit=200){
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('HTTP '+res.status);
  const data = await res.json();
  return data.map(c => ({ openTime:c[0], open:+c[1], high:+c[2], low:+c[3], close:+c[4], volume:+c[5] }));
}
function pushLocal(title, body){ if(Notification.permission==='granted' && navigator.serviceWorker?.controller){ navigator.serviceWorker.controller.postMessage({ type:'LOCAL_NOTIFY', title, body }); } }
$('#btnAskNotif').onclick = async()=>{ const p = await Notification.requestPermission(); log('Permissão de notificação: '+p); };
$('#btnTestNotif').onclick = ()=> pushLocal('Teste de notificação','Se você viu esta notificação, as permissões estão OK.');
$('#btnDiag').onclick = async ()=>{ try{ const pair=$('#pair').value.trim(); const itv=$('#interval').value; const kl=await fetchKlines(pair,itv,5); log('Diagnóstico: Binance OK. Último close '+kl.at(-1).close); }catch(e){ log('Diagnóstico falhou: '+e.message); } };
$('#btnStart').onclick = ()=> start(); $('#btnStop').onclick = ()=> stop();
async function tick(){
  try{
    const pair=$('#pair').value.trim(); const itv=$('#interval').value; const per=+$('#rsiPeriod').value||14;
    const k = await fetchKlines(pair,itv,per+50); const closes = k.map(x=>x.close); const r = rsi(closes, per);
    const price = closes.at(-1).toFixed(2); setStatus(`Último preço: ${price} • RSI ${r?.toFixed(1)}`);
    const strat=$('#strategy').value; let signal=null;
    if(r!==null){ if(strat==='daytrade'){ if(r<30) signal='BUY'; else if(r>70) signal='SELL'; } else { if(r<35) signal='BUY'; else if(r>65) signal='SELL'; } }
    if(signal){ addSignal(new Date(), pair, signal, price, r.toFixed(1)); pushLocal(`Sinal ${signal}`, `${pair} @ ${price} (RSI ${r.toFixed(1)})`); }
  }catch(e){ log('tick erro: '+e.message); }
}
function start(){ if(loop) return; setStatus('Loop iniciado'); log('Loop iniciado'); loop = setInterval(tick, 15000); tick(); }
function stop(){ if(loop){ clearInterval(loop); loop=null; setStatus('Loop parado'); log('Loop parado'); } }
function addSignal(dt, pair, side, price, rsi){
  const tr = document.createElement('tr'); tr.innerHTML = `<td>${dt.toLocaleTimeString()}</td><td>${pair}</td><td>${side}</td><td>${price}</td><td>${rsi}</td>`;
  tblBody.prepend(tr); const rec={t:dt.toISOString(),pair,side,price,rsi}; const hist=JSON.parse(localStorage.getItem('signals_hist')||'[]'); hist.unshift(rec); localStorage.setItem('signals_hist', JSON.stringify(hist.slice(0,200)));
}
const fbFields=['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId','measurementId','vapidKey'];
function loadFirebaseCfg(){ try{ return JSON.parse(localStorage.getItem('fb_cfg')||'null'); }catch{ return null; } }
function saveFirebaseCfg(cfg){ localStorage.setItem('fb_cfg', JSON.stringify(cfg)); }
$('#btnSaveFirebase').onclick = ()=>{ const cfg=Object.fromEntries(fbFields.map(k=>[k,$('#fb_'+k).value.trim()])); saveFirebaseCfg(cfg); log('Firebase salvo no dispositivo.'); };
$('#btnClearFirebase').onclick = ()=>{ localStorage.removeItem('fb_cfg'); log('Firebase limpo.'); };
(()=>{ const cfg=loadFirebaseCfg(); if(cfg) fbFields.forEach(k=>{ const el=$('#fb_'+k); if(el) el.value = cfg[k]||''; }); })();
(async ()=>{ if('serviceWorker' in navigator){ const base = window.__REPO_BASE__ || '/signals-ai-capacitor-v92/'; try{ await navigator.serviceWorker.register(base+'sw.js', {scope: base}); log('ServiceWorker registrado.'); }catch(e){ log('SW erro: '+e.message); } } })();
