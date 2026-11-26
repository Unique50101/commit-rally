import test from 'node:test';
import assert from 'node:assert/strict';
import {circuit,driver,step,replay,encode,demo} from '../docs/engine.mjs';
import {sectorsFromWeeks} from '../build.mjs';
test('weekly counts shape the twelve sectors including empty accounts',()=>{
  const weeks=Array.from({length:52},()=>({contributionDays:[{contributionCount:0}]}));
  assert.deepEqual(sectorsFromWeeks(weeks),Array(12).fill(0));
  weeks.at(-1).contributionDays[0].contributionCount=20;
  assert.equal(sectorsFromWeeks(weeks).at(-1),9);
});
for (const sectors of [demo,Array(12).fill(0),Array(12).fill(9)]) {
  test('complete and replay a perfect lap on '+sectors.join(''),()=>{
    const track=circuit(sectors),car=driver(),moves=[];
    while(car.d<track.length && moves.length<1500) {
      const lane=track.gates[car.gate]?.lane??0;
      moves.push(lane);step(track,car,lane);
    }
    assert.equal(car.hits,12);
    const code=encode(moves);
    assert.deepEqual(replay(track,code,moves.length),moves);
    assert.throws(()=>replay(track,encode(moves.slice(0,-1)),moves.length-1));
    assert.throws(()=>replay(track,encode([...moves,0]),moves.length+1));
  });
}
