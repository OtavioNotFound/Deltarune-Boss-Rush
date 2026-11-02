/* Character ownership and complete input snapshots; no native-game assumptions. */
(function(root){
 'use strict';
 const keys=['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','z','x','c'];
 const seatValid=seat=>Number.isInteger(seat)&&seat>=0&&seat<3;
 const keyArray=list=>Array.isArray(list)&&list.length<=7&&list.every(key=>keys.includes(key))&&new Set(list).size===list.length;
 class Party {
  constructor(clock=()=>Date.now()){
   this.clock=clock;this.owners=[0,-1,-1];this.connected=[true,false,false];
   this.held=[new Set(),new Set(),new Set()];this.sequence=[-1,-1,-1];this.lastInput=[0,0,0];
  }
  connect(seat){if(!seatValid(seat)||seat===0)return false;this.connected[seat]=true;this.sequence[seat]=-1;this.lastInput[seat]=this.clock();this.held[seat].clear();return true;}
  disconnect(seat){if(!seatValid(seat)||seat===0)return;this.connected[seat]=false;this.held[seat].clear();this.sequence[seat]=-1;this.owners=this.owners.map(owner=>owner===seat?-1:owner);}
  claim(seat,characters,locked=false){
   if(locked||!seatValid(seat)||!this.connected[seat]||!Array.isArray(characters)||characters.length>3||new Set(characters).size!==characters.length||characters.some(char=>!Number.isInteger(char)||char<0||char>2||![seat,-1].includes(this.owners[char])))return false;
   this.owners=this.owners.map((owner,char)=>characters.includes(char)?seat:owner===seat?-1:owner);return true;
  }
  input(seat,key,down){if(!seatValid(seat)||!this.connected[seat]||!keys.includes(key))return false;down?this.held[seat].add(key):this.held[seat].delete(key);return true;}
  release(seat){if(seatValid(seat))this.held[seat].clear();}
  receive(seat,packet){
   if(!seatValid(seat)||seat===0||!this.connected[seat]||packet?.v!==2||packet.type!=='input'||!Number.isSafeInteger(packet.seq)||packet.seq<0||packet.seq<=this.sequence[seat]||!keyArray(packet.keys))return false;
   this.sequence[seat]=packet.seq;this.lastInput[seat]=this.clock();this.held[seat]=new Set(packet.keys);return true;
  }
  expire(){for(let seat=1;seat<3;seat++)if(this.connected[seat]&&this.clock()-this.lastInput[seat]>1500)this.release(seat);}
  effectiveOwners(){return this.owners.map(owner=>seatValid(owner)&&this.connected[owner]?owner:0);}
  packet(active=true){this.expire();return{v:2,active:active?1:0,owners:this.effectiveOwners(),held:this.held.map(held=>Array.from({length:10},(_,i)=>i<keys.length&&held.has(keys[i])?1:0))};}
 }
 root.BossRoomPartyCore={Party,keys,seatValid,keyArray};
 if(typeof module!=='undefined')module.exports=root.BossRoomPartyCore;
})(globalThis);
