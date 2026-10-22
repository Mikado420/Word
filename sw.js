/* Service Worker：オフライン対応。常にネットワークの最新を優先し、つながらない時だけキャッシュを使う */
const CACHE="akasheet-v2";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  const sameOrigin=url.origin===location.origin;
  const isFont=url.hostname.endsWith("fonts.googleapis.com")||url.hostname.endsWith("fonts.gstatic.com");
  if(!sameOrigin&&!isFont) return;
  if(sameOrigin&&url.searchParams.has("t")) return; // 更新チェック用の取得はそのままネットへ
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const key=sameOrigin?url.origin+url.pathname:req;
    try{
      // ページ遷移のリクエストはそのままでは cache 指定を付けられないので URL から作り直す
      const res=sameOrigin?await fetch(url.origin+url.pathname,{cache:"no-cache",credentials:"same-origin"}):await fetch(req);
      if(res.ok||res.type==="opaque") cache.put(key,res.clone());
      return res;
    }catch(err){
      const hit=await cache.match(key);
      if(hit) return hit;
      if(req.mode==="navigate"){const idx=await cache.match(url.origin+url.pathname.replace(/[^/]*$/,"")+"index.html")||await cache.match(url.origin+url.pathname.replace(/[^/]*$/,""));if(idx) return idx;}
      throw err;
    }
  })());
});
