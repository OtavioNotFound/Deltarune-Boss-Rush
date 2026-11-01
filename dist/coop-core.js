/* Shared-soul input ownership. The host is the only simulation and save writer. */
(function(root){
 'use strict';
 const movement=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
 const actions=['z','x','c'];
 const keys=[...movement,...actions];
 function owns(role,key){return (role==='movement'?movement:role==='actions'?actions:[]).includes(key);}
 class InputRouter {
  constructor(deliver,clock=()=>Date.now()){
   this.deliver=deliver;this.clock=clock;this.local=new Set();this.remote=new Set();
   this.active=false;this.remoteRole='movement';this.sequence=-1;this.lastPacket=0;
  }
  release(seat){for(const key of this[seat])this.deliver(key,false);this[seat].clear();}
  start(role='movement'){this.stop();this.active=true;this.remoteRole=role;this.lastPacket=this.clock();}
  stop(){this.release('local');this.release('remote');this.active=false;this.sequence=-1;}
  setRole(role){
   if(!['movement','actions'].includes(role))return false;
   this.release('local');this.release('remote');this.remoteRole=role;return true;
  }
  input(key,down){
   if(!keys.includes(key))return;
   if(down&&this.active&&owns(this.remoteRole,key))return;
   if(down&&!this.local.has(key)){this.local.add(key);this.deliver(key,true);}
   if(!down&&this.local.delete(key))this.deliver(key,false);
  }
  receive(packet){
   if(!this.active||packet?.v!==1||packet.type!=='input'||!Number.isSafeInteger(packet.seq)||packet.seq<0||packet.seq<=this.sequence||!Array.isArray(packet.keys)||packet.keys.length>keys.length||packet.keys.some(k=>!owns(this.remoteRole,k)))return false;
   this.sequence=packet.seq;this.lastPacket=this.clock();
   const next=new Set(packet.keys);
   for(const key of this.remote)if(!next.has(key))this.deliver(key,false);
   for(const key of next)if(!this.remote.has(key))this.deliver(key,true);
   this.remote=next;return true;
  }
  expire(){if(this.active&&this.clock()-this.lastPacket>1500){this.release('remote');return true;}return false;}
 }
 root.BossRoomCoopCore={InputRouter,owns,keys};
 if(typeof module!=='undefined')module.exports=root.BossRoomCoopCore;
})(globalThis);
