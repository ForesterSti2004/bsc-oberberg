(function(){
 const section=document.querySelector('#ligatabellen'),button=document.querySelector('#standings-refresh');
 if(!section||!button)return;
 const cards=[...section.querySelectorAll('[data-league]')];
 function number(value,digits=0){return Number(value).toLocaleString('de-DE',{minimumFractionDigits:digits,maximumFractionDigits:digits});}
 function render(league,retrievedAt){
  const card=cards.find(c=>c.dataset.league===league.name);
  if(!card||!Array.isArray(league.rows)||league.rows.length<2||league.rows.length>20)throw Error('Invalid league data');
  if(!league.rows.every(r=>typeof r.team==='string'&&['rank','pins','average','points','bonus','total'].every(k=>Number.isFinite(r[k])&&r[k]>=0)))throw Error('Invalid table');
  const rows=league.rows.map(r=>{
   const tr=document.createElement('tr');if(r.own)tr.className='own-team';
   const values=[r.rank,r.team,number(r.pins),number(r.average,2),r.points,r.bonus,r.total];
   values.forEach((v,i)=>{const cell=document.createElement(i===1?'th':'td');if(i===1)cell.scope='row';if(i===6){const b=document.createElement('strong');b.textContent=v;cell.append(b);}else cell.textContent=v;tr.append(cell);});
   return tr;
  });
  card.querySelector('tbody').replaceChildren(...rows);
  card.querySelector('.league-day').textContent='Stand nach dem '+league.gameday;
  const url=new URL(league.source);
  if(url.origin==='https://wbuliga.wbubowling.de'&&/^\/index.php\/results\/league\/\d+$/.test(url.pathname))card.querySelector('.league-source').href=url.href;
  const time=new Date(retrievedAt);
  card.querySelector('.league-status').textContent=Number.isNaN(time.getTime())?'Aktualisiert':('Abgerufen: '+time.toLocaleString('de-DE',{timeZone:'Europe/Berlin',dateStyle:'short',timeStyle:'short'})+' Uhr');
 }
 async function refresh(){
  if(button.disabled)return;
  button.disabled=true;button.textContent='Tabellen werden geladen …';section.setAttribute('aria-busy','true');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),43000);
  try{
   const response=await fetch('/api/standings',{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Unavailable');
   const data=await response.json();
   if(!Array.isArray(data.leagues)||!data.leagues.length)throw Error('Empty response');
   for(const league of data.leagues)render(league,data.retrievedAt);
   cards.filter(c=>!data.leagues.some(l=>l.name===c.dataset.league)).forEach(c=>{c.querySelector('.league-status').textContent='Aktualisierung gerade nicht möglich. Gespeicherter Stand wird angezeigt.';});
  }catch(error){
   cards.forEach(c=>{const status=c.querySelector('.league-status');if(!status.dataset.last)status.dataset.last=status.textContent;status.textContent=status.dataset.last+' · Aktualisierung nicht möglich.';});
  }finally{
   clearTimeout(timer);button.disabled=false;button.textContent='Tabellen aktualisieren ↻';section.removeAttribute('aria-busy');
  }
 }
 button.addEventListener('click',refresh);refresh();
})();
