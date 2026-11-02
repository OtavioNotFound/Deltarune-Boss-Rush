const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
module.exports=async function(){
 const root=path.resolve(__dirname,'../dist'),mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.otf':'font/otf','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{const requested=decodeURIComponent(req.url.split('?')[0]);const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{url:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
};
