const {test}=require('node:test');
const assert=require('node:assert/strict');
const {InputRouter,keys}=require(process.env.COOP_CORE_PATH||'../dist/coop-core.js');
function setup(){let now=0;const down=new Set(),events=[];const router=new InputRouter((key,value)=>{events.push([key,value]);value?down.add(key):down.delete(key);},()=>now);router.start();return{router,down,events,time:value=>now=value};}
const packet=(seq,keys)=>({v:1,type:'input',seq,keys});
test('each seat owns disjoint controls; disconnect restores solo',()=>{
 const {router,down}=setup();router.input('ArrowUp',true);assert.equal(down.size,0);
 assert.equal(router.receive(packet(0,['ArrowUp'])),true);router.input('z',true);
 assert.deepEqual([...down],['ArrowUp','z']);router.stop();assert.equal(down.size,0);
 router.input('ArrowUp',true);assert.ok(down.has('ArrowUp'));
});
test('malformed, stale, replayed, unauthorized and oversized snapshots have no effect',()=>{
 const {router,down}=setup();router.receive(packet(4,['ArrowLeft']));
 for(const p of [null,{},packet(3,[]),packet(4,[]),packet(-1,[]),packet(5,['z']),packet(5,['Escape']),packet(5,Array(8).fill('ArrowUp')),{...packet(5,[]),v:2},packet(Infinity,[])])assert.equal(router.receive(p),false);
 assert.deepEqual([...down],['ArrowLeft']);router.receive(packet(6,[]));assert.equal(down.size,0);
});
test('role changes, blur release and lease expiry cannot leave keys held',()=>{
 const {router,down,time}=setup();router.receive(packet(0,['ArrowRight']));router.input('z',true);
 router.setRole('actions');assert.equal(down.size,0);assert.equal(router.receive(packet(1,['ArrowRight'])),false);
 router.receive(packet(2,['x']));router.input('ArrowDown',true);router.release('local');assert.deepEqual([...down],['x']);
 time(1501);assert.equal(router.expire(),true);assert.equal(down.size,0);
 router.receive(packet(3,['x']));assert.ok(down.has('x'));router.stop();assert.equal(down.size,0);
});
test('seeded packet reorder/drop/duplicates converge to the last valid snapshot',()=>{
 const {router,down}=setup();let seed=12345,seq=0;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(let i=0;i<2000;i++){
  const key=keys[Math.floor(rand()*4)],p=packet(seq++,[key]);
  if(rand()>.25)router.receive(p);
  if(rand()>.5)router.receive(packet(Math.max(0,seq-5),['ArrowUp']));
  for(const held of down)assert.ok(keys.slice(0,4).includes(held));
 }
 router.receive(packet(seq++,[]));assert.equal(down.size,0);
});
