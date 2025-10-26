const API_BASE = 'https://magenta-taiyaki-25de5f.netlify.app/.netlify/functions';
const SYM = 'BTCUSDT'; // símbolo padrão
let loop = null;
let tokens = { fcm: null };
const $ = s => document.querySelector(s);
const log = (m, cls='') => { const d=$('#log'); d.innerHTML += (cls?`<span class="${cls}">`:'')+m+(cls?'</span>':'')+'\n'; d.scrollTop = d.scrollHeight; };

function ema(values, period) {
  if (values.length < period) return [];
  const k = 2/(period+1);
  let emaArr = [];
  let prev = values.slice(0,period).reduce((a,b)=>a+b,0)/period;
  emaArr[period-1] = prev;
  for (let i=period;i<values.length;i++) {
    const v = values[i]*k + prev*(1-k);
    emaArr[i] = v; prev = v;
  }
  return emaArr;
}

function rsi(closes, period=14){
  if (closes.length < period+1) return null;
  let gains=0, losses=0;
  for (let i=1;i<=period;i++){
    const ch = closes[i]-closes[i-1];
    if (ch>=0) gains+=ch; else losses-=ch;
  }
  let avgGain=gains/period, avgLoss=losses/period;
  for (let i=period+1;i<closes.length;i++){
    const ch=closes[i]-closes[i-1];
    avgGain = (avgGain*(period-1) + Math.max(ch,0))/period;
    avgLoss = (avgLoss*(period-1) + Math.max(-ch,0))/period;
  }
  const rs = avgLoss===0 ? 100 : avgGain/avgLoss;
  return 100 - (100/(1+rs));
}

async function getKlines(symbol, interval='1m', limit=120){
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('binance '+r.status);
  const data = await r.json();
  return data.map(x => ({
    openTime: x[0], open:+x[1], high:+x[2], low:+x[3], close:+x[4], volume:+x[5], closeTime:x[6]
  }));
}

function pushHistory(row){
  const key='signals_history';
  const arr = JSON.parse(localStorage.getItem(key)||'[]');
  arr.unshift(row);
  localStorage.setItem(key, JSON.stringify(arr.slice(0,200)));
  renderHistory();
}

function renderHistory(){
  const key='signals_history';
  const arr = JSON.parse(localStorage.getItem(key)||'[]');
  const tbody = $('#hist tbody');
  tbody.innerHTML = arr.map(r => `
    <tr>
      <td>${new Date(r.ts).toLocaleString()}</td>
      <td>${r.symbol}</td>
      <td>${r.strategy}</td>
      <td>${r.side}</td>
      <td>${r.price.toFixed(2)}</td>
      <td class="${r.pnl>=0?'ok':'err'}">${(r.pnl??0).toFixed(2)}</td>
    </tr>
  `).join('');
}

async function sendPush(title, body){
  try{
    const r = await fetch(`${API_BASE}/send`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ title, body })
    });
    if(!r.ok) throw new Error('send '+r.status);
    log(`Push OK: ${title}`, 'ok');
  }catch(e){
    log('Push falhou: '+e.message, 'err');
  }
}

async function tick(){
  try{
    const strat = $('#strategy').value;
    const tf = strat==='day' ? '1m' : '15m';
    const kl = await getKlines(SYM, tf, strat==='day'?120:200);
    const closes = kl.map(k=>k.close);
    const rsiVal = rsi(closes,14);
    let fast, slow, side = null;

    if(strat==='day'){
      fast = ema(closes,9).at(-1);
      slow = ema(closes,21).at(-1);
      if(fast && slow){
        if(fast>slow && rsiVal && rsiVal>45) side='BUY';
        if(fast<slow && rsiVal && rsiVal<55) side='SELL';
      }
    }else{
      fast = ema(closes,20).at(-1);
      slow = ema(closes,50).at(-1);
      if(fast && slow){
        if(fast>slow && rsiVal && rsiVal>50) side='BUY';
        if(fast<slow && rsiVal && rsiVal<50) side='SELL';
      }
    }

    if(side){
      const last = closes.at(-1);
      pushHistory({ ts: Date.now(), symbol: SYM, strategy: strat, side, price:last, pnl: 0 });
      sendPush(`Sinal ${side} ${SYM}`, `${strat.toUpperCase()} @ ${last} | EMA/RSI ok`);
      log(`Sinal ${side} ${SYM} @ ${last} | RSI ${rsiVal?.toFixed(1)}`, 'ok');
    }else{
      log('Sem sinal neste tick.');
    }
  }catch(e){
    log('Tick erro: '+e.message, 'err');
  }
}

function start(){
  if(loop) return;
  log('Loop iniciado.');
  loop = setInterval(tick, 60*1000);
  tick();
}

function stop(){
  if(loop){ clearInterval(loop); loop=null; log('Loop parado.'); }
}

async function registerPush(){
  try{
    const r = await fetch(`${API_BASE}/subscribe`, { method:'POST' });
    if(!r.ok) throw new Error('subscribe '+r.status);
    log('Registro de push OK', 'ok');
  }catch(e){
    log('Registro de push falhou: '+e.message, 'err');
  }
}

async function testPush(){
  await sendPush('Teste Signals AI', 'Se você recebeu esta notificação, o push está ativo.');
}

$('#btnRegister').onclick = registerPush;
$('#btnTest').onclick = testPush;
$('#btnStart').onclick = start;
$('#btnStop').onclick = stop;

renderHistory();
log('JS carregado');
