/* オフライン対応 + 常に最新を優先（ネットワーク優先、失敗時のみキャッシュ） */
const CACHE="akasheet";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.pathname.endsWith("/version.json")) return; // 版確認は常にネットへ
  const sameOrigin=url.origin===location.origin;
  const isFont=url.hostname.endsWith("fonts.googleapis.com")||url.hostname.endsWith("fonts.gstatic.com");
  if(!sameOrigin&&!isFont) return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const res=await fetch(req,sameOrigin?{cache:"no-cache"}:{});
      if(res.ok||res.type==="opaque") cache.put(req,res.clone());
      return res;
    }catch(err){
      const hit=await cache.match(req,{ignoreSearch:sameOrigin});
      if(hit) return hit;
      throw err;
    }
  })());
});
