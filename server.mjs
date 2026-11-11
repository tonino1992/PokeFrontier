import {FIELD_MATERIALS} from './habitat.mjs';
import {TECH_NODES,progression,technologyDetail} from './technology.mjs';
import {TALENTS,ROLES,RARITIES,EFFECT_LABELS} from './workforce.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Game,SPECIES,BUILDINGS,RESEARCH,QUESTS} from './game.mjs';
import {StrategicGame,MISSIONS,BIOMES} from './strategic.mjs';
import {CampaignGame} from './campaign.mjs';
import {BUILDINGS as BALANCE_BUILDINGS,RESEARCH as BALANCE_RESEARCH,RECIPES,BALANCE_VERSION} from './balance.mjs';
import {openStorage} from './storage.mjs';
import {passwordRecord,verifyPassword,mintSession} from './auth.mjs';
import {isIP} from 'node:net';

const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=process.env.DATA_DIR||path.join(here,'data');fs.mkdirSync(dataDir,{recursive:true});
const production=process.env.NODE_ENV==='production',publicOrigin=process.env.PUBLIC_ORIGIN||'',authRequired=production||process.env.AUTH_REQUIRED==='true';
if(production&&(!publicOrigin.startsWith('https://')||new URL(publicOrigin).origin!==publicOrigin||process.env.PERSISTENCE!=='sqlite'))throw Error('Online: configura PUBLIC_ORIGIN=https://... senza percorsi e PERSISTENCE=sqlite.');
const storage=await openStorage(dataDir,process.env.PERSISTENCE||'json');let saved;
try{saved=storage.load()}catch(err){console.error('Salvataggio non leggibile: avvio interrotto.',err.message);process.exit(1)}
const speed=process.env.GAME_PROFILE==='sandbox'?20:1;
const game=new CampaignGame(saved,{speed}),streams=new Map(),limits=new Map();
const persist=()=>storage.save(game.serialize());
let persistenceError=null;const safePersist=()=>{try{persist();persistenceError=null}catch(err){persistenceError=err.message;console.error('Salvataggio fallito:',err.message)}};
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const tokenOf=req=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('pf_session='))?.slice(11);
const session=req=>{const entry=game.sessions[tokenOf(req)];if(typeof entry==='string')return authRequired?null:game.players[entry];return entry&&entry.expiresAt>Date.now()?game.players[entry.playerId]:null};
const cookie=(res,token)=>res.setHeader('Set-Cookie',`pf_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token?2592000:0}${production?'; Secure':''}`);
function view(p){return {...game.snapshot(p),account:{hasPassword:storage.hasAccount(p.id),required:authRequired}}}
const authAttempts=new Map();
function clientKey(req){const direct=req.socket.remoteAddress||'unknown';if(process.env.TRUST_PROXY==='true'){const forwarded=String(req.headers['x-forwarded-for']||'').split(',').at(-1).trim();if(isIP(forwarded))return forwarded}return direct}
async function body(req){let size=0,parts=[];for await(const part of req){size+=part.length;if(size>4096)throw Error('Richiesta troppo grande.');parts.push(part)}try{return JSON.parse(Buffer.concat(parts).toString())}catch{throw Error('JSON non valido.')}}
function broadcast(){for(const[res,id]of streams){const p=game.players[id];if(!p||res.destroyed){streams.delete(res);continue}if(res.writableLength>512000){res.destroy();streams.delete(res);continue}res.write('data: '+JSON.stringify(view(p))+'\n\n')}}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://raw.githubusercontent.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
 const url=new URL(req.url,'http://localhost');
 try{
  if(req.method==='POST'){
   if(req.headers.origin&&(publicOrigin?req.headers.origin!==publicOrigin:req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`))return json(res,403,{error:'Origine non autorizzata.'});
   const key=clientKey(req);const window=limits.get(key)||{start:Date.now(),count:0};if(Date.now()-window.start>10000){window.start=Date.now();window.count=0}window.count++;limits.set(key,window);if(window.count>100)return json(res,429,{error:'Troppi comandi, riprova fra pochi secondi.'});
  }
  if(url.pathname==='/api/health')return json(res,200,{ok:!persistenceError,players:Object.keys(game.players).length,online:new Set(streams.values()).size,persistence:persistenceError?'error':'ok'});
  if(url.pathname==='/api/config')return json(res,200,{authRequired,online:production,profile:speed===1?'live':'sandbox',speed,storage:storage.engine});
  if(req.method==='POST'&&['/api/login','/api/join','/api/account/claim'].includes(url.pathname)){const key=clientKey(req),entry=authAttempts.get(key)||{count:0,end:Date.now()+600000};if(Date.now()>entry.end){entry.count=0;entry.end=Date.now()+600000}if(++entry.count>15)return json(res,429,{error:'Troppi tentativi di accesso. Riprova fra dieci minuti.'});authAttempts.set(key,entry)}
  if(url.pathname==='/api/login'&&req.method==='POST'){const input=await body(req),record=typeof input.name==='string'?storage.account(input.name.trim()):null;if(!await verifyPassword(input.password,record))return json(res,401,{error:'Nome o password non corretti.'});const p=game.players[record.player_id];if(!p)return json(res,401,{error:'Account non disponibile.'});const token=mintSession(game,p.id);persist();cookie(res,token);return json(res,200,view(p))}
  if(url.pathname==='/api/logout'&&req.method==='POST'){const p=session(req);delete game.sessions[tokenOf(req)];if(p)for(const[stream,id]of streams)if(id===p.id){stream.end();streams.delete(stream)}persist();cookie(res,'');return json(res,200,{ok:true})}
  if(url.pathname==='/api/account/claim'&&req.method==='POST'){const p=session(req);if(!p)return json(res,401,{error:'Sessione non valida.'});if(storage.hasAccount(p.id))return json(res,409,{error:'Account già protetto.'});const input=await body(req),record=await passwordRecord(input.password);storage.register({name:p.name,player_id:p.id,...record},game.serialize());persist();return json(res,200,{ok:true})}
  if(url.pathname==='/api/catalog')return json(res,200,{technology:TECH_NODES,fieldMaterials:FIELD_MATERIALS,workforce:{talents:TALENTS,roles:ROLES,rarities:RARITIES,effects:EFFECT_LABELS},balanceVersion:BALANCE_VERSION,species:SPECIES,buildings:BALANCE_BUILDINGS,research:BALANCE_RESEARCH,recipes:RECIPES,quests:QUESTS.map(q=>({...q,reward:Object.fromEntries(Object.entries(q.reward).map(([r,n])=>[r==='energy'?'reagents':r,n]))})),missions:Object.fromEntries(Object.entries(MISSIONS).map(([id,m])=>[id,{...m,work:m.work/speed}])),biomes:Object.fromEntries(Object.entries(BIOMES).map(([id,b])=>[id,{...b,resource:b.resource==='energy'?'reagents':b.resource}]))});
  if(url.pathname==='/api/join'&&req.method==='POST'){
   if(session(req))return json(res,409,{error:'Esiste già una sessione in questo browser.'});const input=await body(req);const record=authRequired||input.password?await passwordRecord(input.password):null;const {p,token}=game.create(input.name,input.starter);p.online=false;game.sessions[token]={playerId:p.id,expiresAt:Date.now()+2592000000};try{if(record)storage.register({name:p.name,player_id:p.id,...record},game.serialize());persist()}catch(err){delete game.players[p.id];delete game.sessions[token];throw err}cookie(res,token);return json(res,200,view(p));
  }
  if(['/api/progression','/api/technology'].includes(url.pathname)){const p=session(req);if(!p)return json(res,401,{error:'Sessione non valida.'});return json(res,200,url.pathname==='/api/progression'?progression(game,p):technologyDetail(game,p,url.searchParams.get('kind'),url.searchParams.get('id')))}
  if(url.pathname==='/api/me'){const p=session(req);return p?json(res,200,view(p)):json(res,401,{error:'Scegli nome e starter per iniziare.'})}
  if(url.pathname==='/api/events'){
   const p=session(req);if(!p)return json(res,401,{error:'Sessione non valida.'});if([...streams.values()].filter(id=>id===p.id).length>=4)return json(res,429,{error:'Troppe finestre aperte.'});p.online=true;p.lastSeen=Date.now();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});streams.set(res,p.id);res.write('data: '+JSON.stringify(view(p))+'\n\n');req.on('close',()=>{streams.delete(res);if(![...streams.values()].includes(p.id)){p.online=false;p.lastSeen=Date.now()}});return;
  }
  if(url.pathname==='/api/work-preview'&&req.method==='POST'){const p=session(req);if(!p)return json(res,401,{error:'Sessione non valida.'});return json(res,200,game.previewWork(p,await body(req)))}
  if(url.pathname==='/api/command'&&req.method==='POST'){const p=session(req);if(!p)return json(res,401,{error:'Sessione non valida.'});if(persistenceError)return json(res,503,{error:'Salvataggio momentaneamente non disponibile.'});game.command(p,await body(req));persist();schedule();return json(res,200,{ok:true})}
  if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Endpoint inesistente.'});
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Metodo non consentito.'});
  if(/^\/assets\/[a-z][a-z0-9-]*\.jpg$/.test(url.pathname)){const asset=path.join(here,'public',url.pathname.slice(1));if(!fs.existsSync(asset)){res.writeHead(404);return res.end('Non trovato')}res.setHeader('Content-Type','image/jpeg');res.setHeader('Cache-Control','public, max-age=3600');res.writeHead(200);return res.end(req.method==='HEAD'?undefined:fs.readFileSync(asset))}
  const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/client.js':'client.js'};const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Non trovato')};const content=fs.readFileSync(path.join(here,'public',file));res.setHeader('Content-Type',file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-cache');res.writeHead(200);res.end(req.method==='HEAD'?undefined:content);
 }catch(err){json(res,400,{error:err.message})}
});
let eventTimer;
function schedule(){clearTimeout(eventTimer);const due=game.nextEventAt();if(due!==null)eventTimer=setTimeout(()=>{game.tick();safePersist();broadcast();schedule()},Math.max(1,Math.min(2147483647,due-Date.now())))}
schedule();const send=setInterval(()=>{game.tick();broadcast()},1000),save=setInterval(safePersist,5000),cleanup=setInterval(()=>{for(const[k,v]of limits)if(Date.now()-v.start>60000)limits.delete(k);for(const[k,v]of authAttempts)if(Date.now()>v.end)authAttempts.delete(k)},60000);
const port=Number(process.env.PORT||3100),host=process.env.HOST||'127.0.0.1';server.listen(port,host,()=>console.log(`PokéFrontier pronto su http://${host}:${port}`));
server.requestTimeout=15000;server.headersTimeout=10000;
function shutdown(){clearTimeout(eventTimer);clearInterval(send);clearInterval(save);clearInterval(cleanup);safePersist();for(const res of streams.keys())res.end();server.close(()=>{storage.close();process.exit(0)});setTimeout(()=>process.exit(0),2000).unref()}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
