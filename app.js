const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
const copy={termine:['Training · donnerstags ab 17:00 Uhr','Unser Training findet im Bowling Center Oberberg in Bergneustadt statt.'],neuigkeiten:['Hier entsteht unser Vereinsjournal.','Berichte von der Bahn, Einblicke ins Vereinsleben und aktuelle Meldungen findest du künftig an dieser Stelle.']};
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});const c=copy[b.dataset.view];document.querySelector('#updates h3').textContent=c[0];document.querySelector('#updates p').textContent=c[1];document.querySelector('#updates .label').textContent=b.dataset.view==='termine'?'JEDE WOCHE · BERGNEUSTADT':'BALD HIER';const link=document.querySelector('#training-center-link');if(link)link.style.display=b.dataset.view==='termine'?'inline-block':'none'}));
const legal=document.querySelector('#legal');
const texts={impressum:["Impressum – Angaben noch unvollständig","Anbieter: 1. Bowling Sport Club Oberberg e.V. (eingetragener Verein).","Vereinsanschrift: [Straße und Hausnummer], [Postleitzahl und Ort], Deutschland.","Kontakt: E-Mail: [öffentliche Vereins-E-Mail ergänzen]. Telefon: [öffentliche Telefonnummer ergänzen].","Vertretungsberechtigter Vorstand gemäß § 26 BGB: [Namen und Vertretungsregelung entsprechend dem aktuellen Vereinsregister bzw. der Satzung ergänzen].","Vorstand laut Vereinsangaben: 1. Vorsitzender: Michael Kozak; 2. Vorsitzender: Oliver Schneider; Geschäftsführer: Rene Schulze; Kassenwart: Jasmin Küpper; Sportwart: Michael Kozak.","Vereinsregister: Registergericht: [Amtsgericht ergänzen]. Registernummer: VR [Nummer ergänzen].","Dieser Entwurf ist noch nicht vollständig. Vereinsanschrift, öffentliche Kontaktdaten, Registerangaben und die rechtliche Vertretung müssen vor Fertigstellung ergänzt bzw. bestätigt werden."],datenschutz:["Datenschutzerklärung","Die ausführliche Datenschutzerklärung mit Informationen zu Hosting, Ihren Rechten und der freiwilligen Offlinefunktion finden Sie unter /datenschutz.html. Vereinsanschrift und Datenschutzkontakt sind noch zu ergänzen."]};
document.querySelectorAll('[data-dialog]').forEach(b=>b.addEventListener('click',()=>{const [title,...paras]=texts[b.dataset.dialog];document.querySelector('#legal-title').textContent=title;const content=document.querySelector('#legal-content');content.replaceChildren(...paras.map(t=>{const p=document.createElement('p');p.textContent=t;return p}));legal.showModal()}));
document.querySelector('#close-dialog').addEventListener('click',()=>legal.close());
document.querySelector('#year').textContent=new Date().getFullYear();
let installPrompt;const install=document.querySelector('#install');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;install.hidden=false});install.addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;install.hidden=true});

const offlineButton=document.querySelector('#offline-toggle');
const offlineStatus=document.querySelector('#offline-status');
let offlineEnabled=false;
function offlineMessage(text){if(offlineStatus)offlineStatus.textContent=text;}
function offlineState(enabled){
 offlineEnabled=enabled;
 if(offlineButton){offlineButton.textContent=enabled?'Offline-Daten löschen':'Offline nutzen';offlineButton.setAttribute('aria-pressed',String(enabled));}
}
function askWorker(worker,type){
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const timer=setTimeout(()=>{channel.port1.close();reject(new Error('timeout'));},30000);
  channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data?.ok?resolve(event.data):reject(new Error('offline failed'));};
  worker.postMessage({type},[channel.port2]);
 });
}
async function activeOfflineWorker(registration){
 const worker=registration.installing||registration.waiting||registration.active;
 if(!worker)throw new Error('No service worker');
 if(worker.state==='activated')return worker;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{worker.removeEventListener('statechange',changed);reject(new Error('activation timeout'));},20000);
  function changed(){
   if(worker.state==='activated'){clearTimeout(timer);worker.removeEventListener('statechange',changed);resolve(worker);}
   if(worker.state==='redundant'){clearTimeout(timer);worker.removeEventListener('statechange',changed);reject(new Error('activation failed'));}
  }
  worker.addEventListener('statechange',changed);changed();
 });
}
if(offlineButton){
 offlineButton.disabled=true;
 if(!('serviceWorker'in navigator)||!('caches'in window)){
  offlineMessage('Dieser Browser unterstützt die Offlinefunktion nicht.');
 }else{
  (async()=>{
   try{
    const registration=await navigator.serviceWorker.getRegistration('/');
    if(registration&&new URL((registration.active||registration.installing||registration.waiting)?.scriptURL||location.href).pathname==='/sw.js'){
     if(navigator.onLine)await registration.update();
     const worker=await activeOfflineWorker(registration);
     const result=await askWorker(worker,'OFFLINE_STATUS');
     offlineState(result.enabled);
    }
    await caches.delete('bsc-oberberg-v1');
    offlineMessage(offlineEnabled?'Offline verfügbar. Externe Links benötigen Internet.':'Offline ist ausgeschaltet. Es werden keine zusätzlichen Offline-Inhalte gespeichert.');
   }catch(error){offlineMessage('Offline-Status konnte nicht geprüft werden. Online kannst du die Funktion neu aktivieren.');}
   finally{offlineButton.disabled=false;}
  })();
  offlineButton.addEventListener('click',async()=>{
   offlineButton.disabled=true;
   try{
    if(offlineEnabled){
     const reg=await navigator.serviceWorker.getRegistration('/');
     if(reg){await askWorker(await activeOfflineWorker(reg),'OFFLINE_DISABLE');await reg.unregister();}
     else{await caches.delete('bsc-oberberg-offline-v2');await caches.delete('bsc-oberberg-v1');}
     offlineState(false);
     offlineMessage('Offline ausgeschaltet. Die gespeicherten Offline-Inhalte wurden gelöscht.');
    }else{
     if(!navigator.onLine)throw new Error('Internet required');
     offlineMessage('Seite wird für die Offline-Nutzung gespeichert …');
     const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
     await askWorker(await activeOfflineWorker(reg),'OFFLINE_ENABLE');
     offlineState(true);
     offlineMessage('Offline verfügbar. Du kannst die Seite jetzt auch ohne Internet öffnen. Externe Links benötigen Internet.');
    }
   }catch(error){offlineMessage('Das hat nicht geklappt. Bitte prüfe die Internetverbindung und versuche es erneut.');}
   finally{offlineButton.disabled=false;}
  });
 }
}

