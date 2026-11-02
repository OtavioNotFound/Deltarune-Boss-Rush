const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Party}=require('../dist/party-core.js');
const input=(seq,keys)=>({v:2,type:'input',seq,keys});
test('exclusive claims support several characters and prevent stealing',()=>{
 const party=new Party();party.connect(1);party.connect(2);
 assert.equal(party.claim(1,[1,2]),true);assert.deepEqual(party.owners,[0,1,1]);
 assert.equal(party.claim(2,[1]),false);assert.equal(party.claim(0,[0,1]),false);
 assert.equal(party.claim(1,[2]),true);assert.equal(party.claim(2,[1]),true);assert.deepEqual(party.owners,[0,2,1]);
 assert.equal(party.claim(2,[],true),false);assert.deepEqual(party.owners,[0,2,1]);
});
test('unclaimed and disconnected characters fall back to host',()=>{
 const party=new Party();assert.deepEqual(party.packet().owners,[0,0,0]);party.connect(1);party.claim(1,[1,2]);
 party.receive(1,input(0,['ArrowRight','z']));assert.equal(party.packet().held[1][1],1);
 party.disconnect(1);assert.deepEqual(party.owners,[0,-1,-1]);assert.deepEqual(party.packet().owners,[0,0,0]);assert.ok(party.packet().held[1].every(value=>value===0));
 party.connect(1);assert.equal(party.receive(1,input(0,[])),true);
});
test('snapshots reject malformed, stale and duplicate data and expire held keys',()=>{
 let now=10;const party=new Party(()=>now);party.connect(1);party.receive(1,input(3,['x']));
 for(const p of [null,{},input(2,[]),input(3,[]),input(-1,[]),input(4,['Escape']),input(4,['x','x']),input(Infinity,[]),{...input(4,[]),v:1}])assert.equal(party.receive(1,p),false);
 assert.equal(party.packet().held[1][5],1);now=1511;assert.ok(party.packet().held[1].every(value=>value===0));
 assert.equal(party.receive(1,input(4,['c'])),true);assert.equal(party.packet().held[1][6],1);
 assert.equal(party.receive(0,input(5,['z'])),false);assert.equal(party.receive(2,input(5,['z'])),false);
});
test('each seat has its own complete native input array and lease',()=>{
 let now=0;const party=new Party(()=>now);party.connect(1);party.connect(2);party.input(0,'ArrowUp',true);
 party.receive(1,input(0,['ArrowDown','z']));now=1000;party.receive(2,input(0,['ArrowLeft','x']));now=1600;
 const packet=party.packet();assert.equal(packet.held[0][2],1);assert.ok(packet.held[1].every(v=>v===0));assert.equal(packet.held[2][3],1);assert.equal(packet.held[2][5],1);
 party.release(0);assert.ok(party.packet(false).held[0].every(v=>v===0));assert.equal(party.packet(false).active,0);
});
test('seeded reorder/drop/duplicate snapshots converge without cross-seat input',()=>{
 const party=new Party();party.connect(1);party.connect(2);let seed=123;
 const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 for(let seq=0;seq<2000;seq++){
  if(rand()>.2)party.receive(1,input(seq,['z']));if(rand()>.2)party.receive(2,input(seq,['ArrowRight']));
  if(rand()>.5)party.receive(1,input(Math.max(0,seq-2),['x']));
 }
 party.receive(1,input(2001,[]));party.receive(2,input(2001,[]));assert.ok(party.packet().held.flat().every(v=>v===0));
});
