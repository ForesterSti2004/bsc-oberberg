const ORIGIN='https://wbuliga.wbubowling.de';
const SEASON_URL=ORIGIN+'/index.php/results/season/16';
const NAMES=['Bezirksliga 5','Landesliga 3'];
function clean(value){
 return value.replace(/<[^>]*>/g,' ').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#039;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
}
function selectOptions(html,id){
 const block=html.match(new RegExp('<select\\b[^>]*\\bid=["\\x27]'+id+'["\\x27][^>]*>([\\s\\S]*?)<\\/select>','i'));
 if(!block)throw Error('Missing '+id+' selector');
 return [...block[1].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map(m=>({id:m[1].match(/\bvalue=["'](\d+)["']/)?.[1],label:clean(m[2]),selected:/\bselected\b/.test(m[1])}));
}
function parseTable(html,name,url){
 const league=selectOptions(html,'league').find(o=>o.selected);
 const season=selectOptions(html,'season').find(o=>o.selected);
 const gameday=selectOptions(html,'gameday').find(o=>o.selected);
 if(league?.label!==name||season?.label.replace(/\s/g,'')!=='2026/2027')throw Error('Unexpected league or season');
 const start=html.search(/Saisontabelle der Liga/i);
 const table=start>=0?html.slice(start).match(/<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1]:null;
 const body=table?.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1];
 if(!body)throw Error('Season table missing');
 const number=s=>{const n=Number(s.replace(/\./g,'').replace(',','.'));if(!Number.isFinite(n)||n<0||s==='')throw Error('Invalid number');return n;};
 const rows=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m,i)=>{
  const cells=[...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>clean(c[1]));
  if(cells.length!==7||!cells[1])throw Error('Unexpected columns');
  return {rank:i+1,team:cells[1],pins:number(cells[2]),average:number(cells[3]),points:number(cells[4]),bonus:number(cells[5]),total:number(cells[6]),own:/\bBSC Oberberg\b/i.test(cells[1])};
 });
 if(rows.length<2||rows.length>20||!rows.some(r=>r.own))throw Error('Unexpected teams');
 return {name,season:season.label,gameday:gameday?.label||'',source:url,rows};
}
function leagueSource(html,name){
 const season=selectOptions(html,'season').find(o=>o.selected);
 if(season?.label.replace(/\s/g,'')!=='2026/2027')throw Error('Unexpected season');
 const row=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].find(m=>clean(m[1].match(/<td\b[^>]*class=["'][^"']*liganame[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1]||'')===name)?.[1];
 if(!row)throw Error('League row missing');
 const cells=[...row.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)].filter(m=>/\bresults-online\b/.test(m[1]));
 const id=cells.at(-1)?.[2].match(/\/results\/league\/(\d+)/)?.[1];
 if(!id)throw Error('No published matchdays');
 return ORIGIN+'/index.php/results/league/'+id;
}
async function getHtml(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{Accept:'text/html','User-Agent':'BSC-Oberberg-Standings/1.0'}});
 if(!response.ok)throw Error('WBU status '+response.status);
 const html=await response.text();if(html.length>1500000)throw Error('Source too large');return html;
}
module.exports=async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 try{
  const seasonHtml=await getHtml(SEASON_URL);
  const results=await Promise.allSettled(NAMES.map(async name=>{
   const source=leagueSource(seasonHtml,name);
   return parseTable(await getHtml(source),name,source);
  }));
  const leagues=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(leagues.length===0)throw Error('No valid WBU tables');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=600, stale-while-revalidate=1800');
  return res.status(200).json({retrievedAt:new Date().toISOString(),leagues,partial:leagues.length!==NAMES.length});
 }catch(error){
  console.error('WBU standings unavailable:',error.message);
  res.setHeader('Cache-Control','no-store');
  return res.status(502).json({error:'Die WBU-Tabellen sind gerade nicht erreichbar.'});
 }
};
