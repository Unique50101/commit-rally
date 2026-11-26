import {HZ,circuit,driver,step,encode,replay} from './engine.mjs';
import {backdrop,racers} from './scene.mjs';
const el=id=>document.getElementById(id);
const hash=new URLSearchParams(location.hash.slice(1));
let config=await fetch('./track.json').then(r=>r.json());
let notice='';
const valid=s=>Array.isArray(s)&&s.length===12&&s.every(v=>Number.isInteger(v)&&v>=0&&v<=9);
if(hash.size) {
  if(hash.get('v')==='1' && /^\d{12}$/.test(hash.get('s')||'')) {
    config={sectors:[...hash.get('s')].map(Number), name:'Challenge circuit'};
  } else notice='Unrecognized challenge link. Showing the home circuit.';
}
if(!valid(config.sectors)) throw Error('Invalid circuit');
const track=circuit(config.sectors), key='commit-rally-v1-'+config.sectors.join('');
let best, rival, run, ghost, moves, lane, active=false, last=0, debt=0;
function readLap(code,n) { return {moves:replay(track,code,n),n,code}; }
try {
  const stored=JSON.parse(localStorage.getItem(key));
  if(stored) best=readLap(stored.code,stored.n);
} catch { /* Storage is optional. */ }
if(hash.has('g') && !notice) {
  try { rival=readLap(hash.get('g'),Number(hash.get('n'))); }
  catch {notice='This ghost could not be loaded. You can still race the track.';}
}
const seconds=t=>(t/HZ).toFixed(2)+' s';
el('base').innerHTML=backdrop(track);
el('course').textContent=config.name;
function steer(value) {
  lane=value;
  for(const button of el('lanes').children) button.setAttribute('aria-pressed',Number(button.dataset.lane)===lane);
}
function draw() {
  el('cars').innerHTML=racers(track,run,ghost);
  el('clock').textContent=seconds(run.ticks);
  el('score').textContent=run.hits+' / 12 boosts';
}
function reset() {
  run=driver(); moves=[]; ghost=(rival||best)?driver():null;
  steer(0); draw(); el('share').disabled=!best;
}
reset();
if(notice || rival || best) el('status').textContent=notice||('Beat the ghost · '+seconds((rival||best).n));
let target;
el('start').onclick=()=>{
  reset(); target=rival||best; active=true; last=performance.now(); debt=0;
  el('start').textContent='Restart lap'; el('status').textContent=target?'Race the cyan ghost · '+seconds(target.n):'Lap in progress'; el('url').hidden=true;
};
for(const button of el('lanes').children) button.onclick=()=>steer(Number(button.dataset.lane));
window.addEventListener('keydown',e=>{
  const keys={ArrowLeft:-1,ArrowDown:0,ArrowRight:1};
  if(e.key in keys) { e.preventDefault(); steer(keys[e.key]); }
});
function finish() {
  active=false;
  let result='Finished in '+seconds(run.ticks)+'.';
  if(target) {
    const delta=run.ticks-target.n;
    result+=delta===0?' Dead heat!':' '+seconds(Math.abs(delta))+(delta<0?' ahead of the ghost.':' behind the ghost.');
  }
  if(!best || run.ticks<best.n) {
    best={n:run.ticks,code:encode(moves),moves};
    try {localStorage.setItem(key,JSON.stringify({n:best.n,code:best.code}));} catch {}
    result+=' Personal best!';
  }
  el('status').textContent=result; el('share').disabled=false; el('start').textContent='Race again';
}
function frame(now) {
  if(active) {
    debt+=Math.min(now-last,120); last=now;
    while(active && debt>=1000/HZ) {
      debt-=1000/HZ;
      if(ghost && run.ticks<target.n) step(track,ghost,target.moves[run.ticks]);
      moves.push(lane); step(track,run,lane);
      if(run.d>=track.length) finish();
    }
    draw();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
el('share').onclick=async()=>{
  const link=new URL(location.href);
  link.hash=new URLSearchParams({v:'1',s:config.sectors.join(''),n:String(best.n),g:best.code});
  const field=el('url'); field.value=link.href; field.hidden=false;
  try { await navigator.clipboard.writeText(link.href); el('status').textContent='Challenge link copied. Best lap · '+seconds(best.n); }
  catch {field.select(); el('status').textContent='Copy the selected challenge link.';}
};
