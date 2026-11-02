const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
module.exports=async function(){
 const project=path.resolve(__dirname,'..'),root=path.join(project,'dist'),prefix='/Deltarune-Boss-Rush/',mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.otf':'font/otf','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;
  if(requested===prefix||requested===prefix+'index.html')file=path.join(project,'index.html');
  else if(requested.startsWith(prefix+'dist/')){
   const relative=requested.slice((prefix+'dist/').length);file=path.resolve(root,relative||'index.html');
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  }else{res.writeHead(404).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 return{rootUrl:origin+prefix,url:origin+prefix+'dist/',close:()=>new Promise(resolve=>server.close(resolve))};
};
