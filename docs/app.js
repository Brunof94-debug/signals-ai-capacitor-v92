
import { rsi } from './lib/ta.js';
const $ = (q)=>document.querySelector(q);
const logs = $('#logs');
const tbody = $('#tbody');
let loop=null, beforePrompt=null;

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); beforePrompt=e; $('#btnInstall').disabled=false; });
$('#btnInstall').onclick = () => beforePrompt?.prompt();

function log(s){ logs.textContent += "\n"+s; logs.scrollTop = logs.scrollHeight; }
async function klines(symbol='BTCUSDT', interval='15m', limit=200){
  const url = 'https://api.binance.com/api/v3/klines?symbol='+symbol+'&interval='+interval+'&limit='+limit;
  const r = await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return (await r.json()).map(c=>({t:c[0],o:+c[1],h:+c[2],l:+c[3],c:+c[4]}));
}
function addSignal(side, price, r){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${new Date().toLocaleString()}</td><td>BTCUSDT</td><td>day</td><td>${side}</td><td>${price}</td><td>0.00</td>`;
  tbody.prepend(tr);
}

async function tick(){
  try{
    const data = await klines(); const closes=data.map(x=>x.c);
    const val = rsi(closes, 14); const price = closes.at(-1).toFixed(1);
    if(val!==null){ const side = val<30?'BUY':(val>70?'SELL':null);
      if(side){ addSignal(side, price, val.toFixed(1)); log(`Sinal ${side} BTCUSDT @ ${price} | RSI ${val.toFixed(1)}`); }
    }
  }catch(e){ log('tick erro: '+e.message); }
}

$('#btnStart').onclick = ()=>{ if(loop) return; log('Loop iniciado.'); loop=setInterval(tick,15000); tick(); };
$('#btnStop').onclick = ()=>{ if(!loop) return; clearInterval(loop); loop=null; log('Loop parado.'); };

(async ()=>{ if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('/signals-ai-capacitor-v92/sw.js', {scope:'/signals-ai-capacitor-v92/'}); log('JS carregado'); }catch(e){ log('SW erro: '+e.message); } } } )();
