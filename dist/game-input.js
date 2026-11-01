/* Normalize keyboard identity for the native Emscripten runner. */
(function(root){
 'use strict';
 const codes={ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39,z:90,x:88,c:67};
 function eventFor(win,type,key){
  const number=codes[key];if(!number)return null;
  const char=type==='keypress'?key.charCodeAt(0):0;
  return new win.KeyboardEvent(type,{key,code:key.length===1?'Key'+key.toUpperCase():key,keyCode:char||number,which:char||number,charCode:char,location:0,bubbles:true,cancelable:true,view:win});
 }
 function installReceiver(win){
  const held=new Set(),forwarded=new WeakSet();let observed;
  const getGamepads=win.navigator.getGamepads?.bind(win.navigator);
  if(getGamepads)win.navigator.getGamepads=()=>win.parent.BossRoomCoop?.active?[]:getGamepads();
  win.addEventListener('keypress',event=>{
   if(!forwarded.has(event)&&win.parent.BossRoomCoop?.active){event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true});
  for(const type of ['keydown','keyup'])win.addEventListener(type,event=>{
   if(forwarded.has(event))return;
   const key=event.key.length===1?event.key.toLowerCase():event.key;
   if(win.parent.BossRoomCoop?.route(key,type==='keydown')){event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true});
  const report=()=>win.parent.postMessage({type:'bossroom-audio-state',state:win.BossRoomAudioContext?.state||'unavailable'},win.location.origin);
  const unlock=()=>{
   const context=win.BossRoomAudioContext;if(!context)return;
   if(context!==observed){observed=context;context.addEventListener('statechange',report);}
   if(context.state==='suspended')context.resume().then(report).catch(report);report();
  };
  win.addEventListener('bossroom-audio-context',unlock);
  win.addEventListener('keydown',unlock,{capture:true});
  win.addEventListener('pointerdown',unlock,{capture:true});unlock();
  const deliver=(type,key)=>{
   const target=win.document.querySelector('canvas')||win.document;
   if(type==='keydown'){unlock();if(held.has(key))return;held.add(key);}
   else held.delete(key);
   const event=eventFor(win,type,key);if(event){forwarded.add(event);target.dispatchEvent(event);}
   if(type==='keydown'&&key.length===1){const press=eventFor(win,'keypress',key);forwarded.add(press);target.dispatchEvent(press);}
  };
  win.addEventListener('message',event=>{
   if(event.source!==win.parent||event.origin!==win.location.origin)return;
   const data=event.data;
   if(data?.type==='bossroom-audio-resume'){unlock();return;}
   if(data?.type==='bossroom-release'){for(const key of Object.keys(codes))deliver('keyup',key);return;}
   if(!data||!['keydown','keyup'].includes(data.type)||!codes[data.key])return;
   deliver(data.type,data.key);
  });
  win.addEventListener('blur',()=>{win.parent.BossRoomCoop?.releaseAll();for(const key of Object.keys(codes))deliver('keyup',key);});
 }
 root.BossRoomInput={eventFor,installReceiver,codes};
 if(typeof module!=='undefined')module.exports=root.BossRoomInput;
})(globalThis);
