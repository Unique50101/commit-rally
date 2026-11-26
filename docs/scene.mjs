const f=n=>n.toFixed(1);
const green='#c4ff45', ghostColor='#65dbff';
function carShape(track,car,color,opacity) {
  const p=track.pose(car.d,car.lane);
  return `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.angle*180/Math.PI)})" opacity="${opacity}"><rect x="-12" y="-7" width="23" height="14" rx="4" fill="#101820"/><path d="M-11 -4 L4 -6 11 -3 11 3 4 6 -11 4Z" fill="${color}"/><path d="M0 -4 L4 -3 4 3 0 4Z" fill="#233047"/><path d="M-8 -5V5" stroke="white" stroke-width="2"/></g>`;
}
export function backdrop(track) {
  const road=track.points.map((p,i)=>(i?'L':'M')+f(p.x)+' '+f(p.y)).join(' ')+'Z';
  const gates=track.gates.map((g,i)=>{
    const p=track.pose(g.d,g.lane);
    return `<g transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.angle*180/Math.PI)})"><path d="M-6 -5l5 5 -5 5 M0 -5l5 5 -5 5" fill="none" stroke="${green}" stroke-width="2.8"/></g>`;
  }).join('');
  const start=track.pose(0);
  return `<defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#314643"/></pattern><pattern id="flag" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e6efe9"/><path d="M0 0h4v4H0zM4 4h4v4H4z" fill="#142420"/></pattern></defs><rect width="800" height="414" fill="#102523"/><rect width="800" height="414" fill="url(#grid)"/><g fill="none" stroke-linejoin="round"><path d="${road}" stroke="#65807a" stroke-width="49"/><path d="${road}" stroke="#d3e1c8" stroke-width="45"/><path d="${road}" stroke="#e97b51" stroke-width="45" stroke-dasharray="9 12"/><path d="${road}" stroke="#273334" stroke-width="39"/><path d="${road}" stroke="#50605d" stroke-width="1" stroke-dasharray="6 8"/></g><rect x="${start.x-20}" y="${start.y-4}" width="40" height="8" fill="url(#flag)"/>${gates}<g text-anchor="middle" font-family="sans-serif"><text x="400" y="202" font-size="38" font-weight="bold" letter-spacing="-1" fill="#e5eee3">COMMIT RALLY</text><text x="400" y="229" font-size="12" letter-spacing="4" fill="${green}">TIME TRIAL</text></g>`;
}
export function racers(track,car,ghost) {
  return (ghost?carShape(track,ghost,ghostColor,.75):'')+carShape(track,car,green,1);
}
