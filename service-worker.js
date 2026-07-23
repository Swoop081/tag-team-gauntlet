/* LEGACY Pro Wrestling Service Worker 8.3.7 Build 9 */
const APP_VERSION = '9.0.2-last-man-standing-layout';
const CACHE_NAME = `lpw-${APP_VERSION}`;
const CRITICAL_FILES = ['index.html','game.js','data.js','styles.css','version.json','manifest.webmanifest','service-worker.js','update-manager.js','assets/config/imageManager.js'];

self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>(key.startsWith('ttg-')||key.startsWith('lpw-'))&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
function isCritical(url){return CRITICAL_FILES.some(name=>url.pathname.endsWith('/'+name)||url.pathname.endsWith(name));}
async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return cached;
    throw error;
  }
}
async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME),cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok)await cache.put(request,response.clone());
  return response;
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const currentCode=request.mode==='navigate'||isCritical(url)||['document','script','style'].includes(request.destination);
  event.respondWith(currentCode?networkFirst(request):cacheFirst(request));
});
