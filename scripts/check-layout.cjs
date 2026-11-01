const assert=require('node:assert/strict');
const {calculateFit}=require('../dist/game-layout.js');
const cases=[[320,432],[360,592],[412,867],[640,312],[844,342],[1280,672],[1920,1032]];
for(const [w,h] of cases)for(const [gw,gh] of [[640,480],[1280,720]]){
 const fit=calculateFit(w,h,gw,gh);
 assert.ok(fit.width<=w+1e-8&&fit.height<=h+1e-8,'Canvas exceeds viewport');
 assert.ok(Math.abs(fit.width/fit.height-gw/gh)<1e-10,'Logical aspect ratio changed');
 assert.ok(Math.abs(fit.width-w)<1e-8||Math.abs(fit.height-h)<1e-8,'Canvas unnecessarily leaves space on both axes');
}
console.log('14 viewport/aspect combinations fit without stretching or cropping.');
