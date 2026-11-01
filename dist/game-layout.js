/* Fit the game's logical resolution inside the available viewport; never stretch it. */
(function(root){
 'use strict';
 function calculateFit(width,height,gameWidth=640,gameHeight=480){
  if(![width,height,gameWidth,gameHeight].every(n=>Number.isFinite(n)&&n>0))return {width:0,height:0};
  const scale=Math.min(width/gameWidth,height/gameHeight);
  return {width:gameWidth*scale,height:gameHeight*scale};
 }
 function fitCanvas(canvas,gameWidth=640,gameHeight=480){
  if(!canvas)return;
  const view=canvas.ownerDocument.defaultView;
  const size=calculateFit(view.innerWidth,view.innerHeight,gameWidth,gameHeight);
  canvas.style.width=size.width+'px';canvas.style.height=size.height+'px';
  canvas.style.flex='none';canvas.style.maxWidth='none';canvas.style.maxHeight='none';
 }
 root.BossRoomLayout={calculateFit,fitCanvas};
 if(typeof module!=='undefined')module.exports=root.BossRoomLayout;
})(globalThis);
