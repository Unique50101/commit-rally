// Version 1 challenge links depend on this fixed-step simulation.
export const HZ = 30;
export const demo = [1,5,3,7,2,8,4,1,6,9,5,2];
export function circuit(sectors) {
  const points = [];
  const lengths = [0];
  for (let i=0; i<=360; i++) {
    const a = i * Math.PI / 180;
    const sector = i / 30;
    const mix = (1-Math.cos((sector%1)*Math.PI))/2;
    const radius = .75 + .026 * (sectors[Math.floor(sector)%12]*(1-mix) + sectors[(Math.floor(sector)+1)%12]*mix);
    const p = {x:400+319*radius*Math.cos(a), y:207+173*radius*Math.sin(a)};
    if (i) lengths.push(lengths[i-1]+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y));
    points.push(p);
  }
  const length = lengths.at(-1);
  function pose(distance,lane=0) {
    const d = ((distance%length)+length)%length;
    let lo=0, hi=360;
    while (hi-lo>1) { const mid=(hi+lo)>>1; if (lengths[mid]<=d) lo=mid; else hi=mid; }
    const t=(d-lengths[lo])/(lengths[hi]-lengths[lo]);
    const p=points[lo], q=points[hi], angle=Math.atan2(q.y-p.y,q.x-p.x);
    return {x:p.x+(q.x-p.x)*t-Math.sin(angle)*lane*12,y:p.y+(q.y-p.y)*t+Math.cos(angle)*lane*12,angle};
  }
  const gates=sectors.map((s,i)=>({d:length*(i+.55)/12,lane:(s+i)%3-1}));
  return {points,length,pose,gates};
}
export function driver() { return {d:0,lane:0,speed:68,ticks:0,hits:0,gate:0,boost:0}; }
export function step(track,car,control) {
  if (car.d>=track.length) return;
  car.lane += (control-car.lane)*.19;
  car.speed += ((car.boost>0 ? 110 : 68)-car.speed)*.095;
  car.boost=Math.max(0,car.boost-1);
  car.d+=car.speed/HZ;
  car.ticks++;
  const gate=track.gates[car.gate];
  if (gate && car.d>=gate.d) {
    if (Math.abs(car.lane-gate.lane)<.48) { car.boost=48; car.hits++; }
    car.gate++;
  }
}
export function encode(moves) {
  const bytes=[];
  for(let i=0;i<moves.length;i++) {
    const n=i>>2;
    bytes[n]=(bytes[n]||0)|((moves[i]+1)<<((i%4)*2));
  }
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decode(code,n) {
  if (!Number.isInteger(n)||n<1||n>1500||typeof code!=='string'||code.length!==Math.ceil(Math.ceil(n/4)*4/3)||!/^[\w-]+$/.test(code)) throw Error('Invalid lap');
  const raw=atob(code.replaceAll('-','+').replaceAll('_','/'));
  const moves=Array.from({length:n},(_,i)=>((raw.charCodeAt(i>>2)>>((i%4)*2))&3)-1);
  if(moves.includes(2)) throw Error('Invalid steering');
  return moves;
}
export function replay(track,code,n) {
  const moves=decode(code,n), car=driver();
  for(const move of moves) step(track,car,move);
  if(car.d<track.length || car.ticks!==n) throw Error('Incomplete lap');
  return moves;
}
