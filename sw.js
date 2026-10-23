const CACHE='bsc-oberberg-offline-v2';
const MARKER=new URL('/__bsc_offline_enabled__',self.location.origin).href;
const FILES=['/','/index.html','/style.css','/app.js','/manifest.webmanifest','/datenschutz.html','/assets/logo.webp','/assets/icon-192.png','/assets/icon-512.png'];
async function isEnabled(){return Boolean(await caches.match(MARKER,{cacheName:CACHE}));}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await caches.delete('bsc-oberberg-v1');
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 const reply=event.ports[0];if(!reply)return;
 event.waitUntil((async()=>{
  try{
   if(event.data?.type==='OFFLINE_ENABLE'){
    const cache=await caches.open(CACHE);
    try{await cache.addAll(FILES);await cache.put(MARKER,new Response('enabled'));}
    catch(error){await caches.delete(CACHE);throw error;}
   }else if(event.data?.type==='OFFLINE_DISABLE'){
    await caches.delete(CACHE);await caches.delete('bsc-oberberg-v1');
   }else if(event.data?.type!=='OFFLINE_STATUS'){throw new Error('Unknown request');}
   reply.postMessage({ok:true,enabled:await isEnabled()});
  }catch(error){reply.postMessage({ok:false,enabled:false});}
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const enabled=await isEnabled();
  try{
   const response=await fetch(event.request);
   if(enabled&&response.ok&&!url.search&&FILES.includes(url.pathname)){
    const clone=response.clone();
    event.waitUntil(caches.open(CACHE).then(async cache=>{if(await isEnabled())await cache.put(event.request,clone);}));
   }
   return response;
  }catch(error){
   if(!enabled)throw error;
   const cached=await caches.match(event.request,{cacheName:CACHE});
   if(cached)return cached;
   if(event.request.mode==='navigate'&&FILES.includes(url.pathname)){
    const page=await caches.match(url.pathname==='/'?'/index.html':url.pathname,{cacheName:CACHE});
    if(page)return page;
   }
   return Response.error();
  }
 })());
});
