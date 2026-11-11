import { randomUUID } from 'node:crypto';
import { KANTO } from './kanto.mjs';
import { effectiveness } from './type-data.mjs';

export const SPECIES=KANTO;
export const BUILDINGS = [
 {id:'hq',name:'Centro operativo',icon:'⌂',desc:'Aumenta magazzino e livello degli edifici.'},
 {id:'habitat',name:'Habitat',icon:'♧',desc:'Quindici nuovi posti per lo studio dei Pokémon per livello.'},
 {id:'quarry',name:'Cava',icon:'⛏',desc:'Produce materiali per costruzioni e ricerca.'},
 {id:'farm',name:'Coltivazioni',icon:'❧',desc:'Producono cibo e ingredienti per pozioni.'},
 {id:'generator',name:'Generatore',icon:'ϟ',desc:'Produce energia per le tecnologie.'},
 {id:'lab',name:'Laboratorio',icon:'⚗',desc:'Sblocca livelli di ricerca più avanzati.'}
];
export const RESEARCH = [
 {id:'attack',name:'Tattiche di squadra',desc:'+8% attacco per livello.'},
 {id:'gather',name:'Estrazione efficiente',desc:'+20% raccolta per livello.'},
 {id:'capture',name:'Strumenti di cattura',desc:'+5 punti percentuali alla probabilità per livello.'}
];
export const QUESTS = [
 {id:'studies',name:'Il lavoro del ricercatore',desc:'Studia un Pokémon nel suo habitat senza attaccarlo.',goal:1,reward:{credits:80,energy:50}},
 {id:'victories',name:'Il primo incontro',desc:'Sconfiggi una creatura selvatica.',goal:1,reward:{credits:100,materials:100}},
 {id:'captures',name:'Un nuovo compagno',desc:'Cattura una creatura.',goal:1,reward:{credits:120,food:150}},
 {id:'gathers',name:'Risorse dalla frontiera',desc:'Raccogli da un giacimento.',goal:1,reward:{materials:150,energy:50}},
 {id:'upgrades',name:'Radici solide',desc:'Completa un miglioramento della base.',goal:1,reward:{credits:150,energy:100}},
 {id:'surveys',name:'Cartografo della Valle',desc:'Esplora tre caselle sconosciute con una ricognizione.',goal:3,reward:{credits:250,materials:300}}
];
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const species=id=>SPECIES.find(s=>s.id===id);
export function stats(c){const s=species(c.species);return {hp:s.hp+(c.level-1)*12,atk:s.atk+(c.level-1)*2,def:s.def+(c.level-1)};}
function creature(id,level=1){const c={id:randomUUID(),species:id,level,xp:0,hp:0};c.hp=stats(c).hp;return c;}
export class Game {
 constructor(saved=null,{random=Math.random}={}){
  this.random=random;this.players=saved?.players||{};this.sessions=saved?.sessions||{};this.chat=saved?.chat||[];this.alliances=saved?.alliances||{};this.enemies=[];this.nodes=[];this.last=Date.now();
  this.seedWorld();
  if(saved?.schemaVersion===2&&Array.isArray(saved.enemies)&&saved.enemies.every(e=>species(e.species))){this.enemies=saved.enemies;this.nodes=saved.nodes||this.nodes}
  for(const p of Object.values(this.players)){p.observed??=[];p.progress.studies??=0;p.online=false;p.target=null;p.dest=null;p.lastSeen=Date.now();for(const c of p.creatures)c.hp=Math.min(c.hp,stats(c).hp);this.accrue(p,clamp((Date.now()-(p.updated||Date.now()))/1000,0,86400));p.updated=Date.now();this.finishJobs(p,Date.now());}
 }
 seedWorld(){
  const positions=[[380,650,'caterpie',1],[440,770,'pidgey',1],[520,580,'psyduck',2],[650,680,'geodude',2],[700,400,'oddish',3],[310,380,'bellsprout',2],[920,280,'pikachu',4],[1120,390,'growlithe',4],[1200,680,'sandshrew',3],[950,800,'poliwag',3],[1330,230,'fearow',5],[1350,850,'vulpix',4]];
  let seed=87231;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let attempts=0;positions.length<36&&attempts<2000;attempts++){const x=240+rand()*1270,y=70+rand()*850;if(x<350&&y>600||positions.some(p=>Math.hypot(p[0]-x,p[1]-y)<115)||Math.hypot(x-1050,y-510)<110)continue;const biome=this.biome({x,y});const pool=this.spawnPool(biome);const s=pool[Math.floor(rand()*pool.length)];positions.push([Math.round(x),Math.round(y),s.id,2+Math.floor(Math.hypot(x-150,y-760)/260)])}
  positions.forEach(([x,y,s,l],i)=>{const c=creature(s,l);this.enemies.push({id:'wild-'+i,x,y,home:{x,y},biome:this.biome({x,y}),species:s,level:l,hp:c.hp,maxHp:c.hp,respawn:0,lastAttack:0,boss:false,participants:{}})});
  this.enemies.push({id:'boss',x:1050,y:510,home:{x:1050,y:510},species:'snorlax',level:12,hp:2200,maxHp:2200,respawn:0,lastAttack:0,boss:true,participants:{}});
  [['articuno',1300,100],['zapdos',1490,320],['moltres',1400,600],['mewtwo',1250,910],['mew',650,120]].forEach(([id,x,y],i)=>this.enemies.push({id:'legend-'+id,x,y,home:{x,y},species:id,level:18+i,hp:3000+i*400,maxHp:3000+i*400,respawn:0,lastAttack:0,boss:true,participants:{}}));
  [[410,850,'materials'],[580,330,'food'],[820,700,'energy'],[1250,450,'materials'],[1320,750,'food']].forEach(([x,y,resource],i)=>this.nodes.push({id:'node-'+i,x,y,resource,amount:300,respawn:0}));
 }
 biome({x,y}){return x>1120&&y<370?'alture':x<760&&y<520?'bosco':x>780&&x<1050?'fiume':'prateria'}
 spawnPool(biome){const types={alture:['roccia','terra','fuoco','drago','lotta','acciaio'],bosco:['erba','coleottero','veleno','psico','spettro','folletto'],fiume:['acqua','ghiaccio'],prateria:['normale','volante','elettro','terra']}[biome];return KANTO.filter(s=>!['articuno','zapdos','moltres','mewtwo','mew'].includes(s.id)&&s.types.some(t=>types.includes(t)))}
 serialize(){return {schemaVersion:2,players:this.players,sessions:this.sessions,alliances:this.alliances,chat:this.chat,enemies:this.enemies,nodes:this.nodes};}
 create(name,starter){
  if(typeof name!=='string'||name.trim().length<2||name.trim().length>20)throw Error('Scegli un nome tra 2 e 20 caratteri.');
  name=name.trim();if(Object.values(this.players).some(p=>p.name.toLowerCase()===name.toLowerCase()))throw Error('Nome già utilizzato. Scegline un altro.');
  if(!['bulbasaur','charmander','squirtle'].includes(starter))throw Error('Starter non valido.');
  const id=randomUUID(),c=creature(starter),offset=(Object.keys(this.players).length%8)*28;
  const base={x:140+offset,y:760+(offset%70)};
  const p={id,name,base,x:base.x,y:base.y,resources:{materials:650,food:450,energy:220,credits:350},buildings:Object.fromEntries(BUILDINGS.map(b=>[b.id,1])),research:{attack:0,gather:0,capture:0},creatures:[c],team:[c.id],balls:10,potions:4,prestige:0,progress:{victories:0,captures:0,gathers:0,upgrades:0,bosses:0},claimed:[],buildJob:null,researchJob:null,dest:null,target:null,lastAttack:0,skillUntil:0,potionUntil:0,pvp:false,alliance:null,online:true,updated:Date.now(),lastSeen:Date.now(),messages:[]};
  p.observed=[];p.progress.studies=0;this.players[id]=p;const token=randomUUID()+randomUUID();this.sessions[token]=id;this.notify(p,'Missione Aurora: avamposto operativo nella Valle di Aster. Inizia lo studio degli habitat.');return {p,token};
 }
 members(p){return p.team.map(id=>p.creatures.find(c=>c.id===id)).filter(Boolean)}
 living(p){return this.members(p).filter(c=>c.hp>0)}
 capacity(p){return 3+p.buildings.habitat*15}
 rates(p){return {materials:p.buildings.quarry*2,food:p.buildings.farm*1.5,energy:p.buildings.generator*.8}}
 cap(p){return 1500+p.buildings.hq*1500}
 accrue(p,seconds){for(const [r,rate]of Object.entries(this.rates(p)))p.resources[r]=Math.min(this.cap(p),p.resources[r]+rate*seconds)}
 notify(p,message){p.messages.push({id:randomUUID(),text:message,time:Date.now()});p.messages=p.messages.slice(-18)}
 pay(p,cost){if(Object.entries(cost).some(([k,v])=>p.resources[k]<v))throw Error('Risorse insufficienti.');for(const[k,v]of Object.entries(cost))p.resources[k]-=v}
 reward(p,r){for(const[k,v]of Object.entries(r))p.resources[k]=Math.min(k==='credits'?1e9:this.cap(p),p.resources[k]+v)}
 buildCost(p,id){const l=p.buildings[id];return {materials:Math.round(120*1.65**(l-1)),food:Math.round(60*1.5**(l-1)),energy:Math.round(35*1.5**(l-1))}}
 researchCost(p,id){const l=p.research[id];return {materials:Math.round(100*1.7**l),energy:Math.round(70*1.7**l),credits:Math.round(50*1.5**l)}}
 finishJobs(p,now){if(p.buildJob&&now>=p.buildJob.end){const id=p.buildJob.id;p.buildings[id]++;p.progress.upgrades++;p.buildJob=null;this.notify(p,BUILDINGS.find(b=>b.id===id).name+' migliorato!')}
  if(p.researchJob&&now>=p.researchJob.end){const id=p.researchJob.id;p.research[id]++;p.researchJob=null;this.notify(p,'Ricerca completata: '+RESEARCH.find(r=>r.id===id).name)}}
 atBase(p){return dist(p,p.base)<65}
 chance(p,e){return clamp(.3+(1-e.hp/e.maxHp)*.55+p.research.capture*.05-(e.level-1)*.015,.1,.95)}
 xp(p,amount,members=this.members(p)){for(const c of members){c.xp+=amount;while(c.xp>=c.level*35){c.xp-=c.level*35;c.level++;c.hp=Math.min(stats(c).hp,c.hp+24);this.notify(p,species(c.species).name+' raggiunge il livello '+c.level+'!')}}}
 defeatEnemy(e,p){if(e.hp>0||e.respawn)return;e.respawn=Date.now()+(e.boss?90000:35000);const winners=e.boss?Object.entries(e.participants).filter(([,damage])=>damage>=e.maxHp*.01).map(([id])=>this.players[id]).filter(Boolean):[p];for(const w of winners){this.reward(w,{materials:e.boss?250:30+e.level*8,credits:e.boss?300:20+e.level*5});w.prestige+=e.boss?100:10+e.level;w.progress.victories++;if(e.boss)w.progress.bosses++;this.xp(w,e.boss?120:20+e.level*5);this.notify(w,e.boss?'Obiettivo cooperativo completato! Ricompensa scientifica ricevuta.':'Vittoria! Risorse ed esperienza ottenute.');if(e.id.startsWith('legend-')&&!w.creatures.some(c=>c.species===e.species)){if(w.creatures.length<this.capacity(w)){w.creatures.push(creature(e.species,e.level));this.notify(w,species(e.species).name+' si unisce al tuo avamposto dopo la missione cooperativa.')}else this.notify(w,'Habitat pieno: amplia la struttura e ripeti la missione per accogliere il Pokémon leggendario.')}if(w.target===e.id)w.target=null}e.participants={}}
 damage(p,e,mult=1){let total=0;for(const c of this.living(p)){const s=species(c.species),defender=e.species?species(e.species):null;const type=defender?(mult>1?Math.max(...s.types.map(t=>effectiveness(t,defender.types))):effectiveness(s.types[0],defender.types)):1;if(type===0)continue;total+=Math.max(1,(stats(c).atk*(1+p.research.attack*.08)-(e.level||1)*.7)*type*mult)}return Math.round(total)}
 hurt(p,damage,incomingType=null,targetId=null){const members=this.living(p);if(!members.length)return;const c=members.find(c=>c.id===targetId)||members[Math.floor(this.random()*members.length)],mult=incomingType?effectiveness(incomingType,species(c.species).types):1;c.hp=Math.max(0,c.hp-Math.round(damage*mult));if(!this.living(p).length){p.x=p.base.x;p.y=p.base.y;p.target=null;p.dest=null;p.pvp=false;for(const m of this.members(p))m.hp=Math.ceil(stats(m).hp*.3);this.notify(p,'L’unità di soccorso ha riportato la squadra all’avamposto. Nessun Pokémon è perduto.')}}
 frontier(p){return p.x>1120&&p.y<350}
 command(p,cmd,now=Date.now()){
  if(!cmd||typeof cmd.type!=='string')throw Error('Comando non valido.');
  switch(cmd.type){
   case 'move':{if(!Number.isFinite(cmd.x)||!Number.isFinite(cmd.y))throw Error('Destinazione non valida.');p.dest={x:clamp(cmd.x,25,1575),y:clamp(cmd.y,25,975)};p.target=null;break}
   case 'study':{const e=this.enemies.find(e=>e.id===cmd.id&&e.hp>0);if(!e)throw Error('Scegli un Pokémon da studiare.');if(p.observed.includes(e.species))throw Error('Hai già registrato questa specie nel diario scientifico.');p.target=e.id;p.dest=null;p.mode='study';p.studyStart=null;break}
   case 'target':{const e=this.enemies.find(e=>e.id===cmd.id&&e.hp>0);const n=this.nodes.find(n=>n.id===cmd.id&&n.amount>0);const other=this.players[cmd.id];if(other){if(other.id===p.id||!p.pvp||!other.pvp||!this.frontier(p)||!this.frontier(other)||!other.online)throw Error('PvP consentito solo fra giocatori consenzienti nella frontiera.');p.target=other.id;p.dest=null;p.mode='attack';p.studyStart=null;break}if(!e&&!n)throw Error('Obiettivo non disponibile.');p.target=cmd.id;p.dest=null;p.mode='attack';p.studyStart=null;break}
   case 'retreat':p.target=null;p.dest={...p.base};p.mode=null;p.studyStart=null;break;
   case 'capture':{const e=this.enemies.find(e=>e.id===p.target&&e.hp>0);if(!e||e.boss)throw Error('Seleziona un selvatico catturabile.');if(dist(p,e)>80)throw Error('Avvicinati al bersaglio.');if(e.hp>e.maxHp*.65)throw Error('Indebolisci il bersaglio sotto il 65% di salute.');if(p.creatures.length>=this.capacity(p))throw Error('Habitat pieno. Miglioralo alla base.');if(p.balls<1)throw Error('Strumenti di cattura esauriti.');p.balls--;if(this.random()<this.chance(p,e)){const c=creature(e.species,e.level);p.creatures.push(c);if(p.team.length<3)p.team.push(c.id);p.progress.captures++;p.prestige+=15;e.hp=0;e.respawn=now+35000;e.participants={};p.target=null;this.notify(p,species(c.species).name+' catturato! Aggiunto alla collezione.')}else this.notify(p,'Cattura fallita. Il selvatico resiste!');break}
   case 'skill':{if(now<p.skillUntil)throw Error('Abilità in recupero.');const e=this.enemies.find(e=>e.id===p.target&&e.hp>0);const other=this.players[p.target];if(e&&dist(p,e)<=80){p.mode='attack';p.skillUntil=now+12000;const dealt=Math.min(e.hp,this.damage(p,e,1.6));e.participants[p.id]=(Number(e.participants[p.id])||0)+dealt;e.hp=Math.max(0,e.hp-dealt);this.defeatEnemy(e,p)}else if(other&&other.online&&dist(p,other)<=80&&p.pvp&&other.pvp&&this.frontier(p)&&this.frontier(other)){p.mode='attack';p.skillUntil=now+12000;const defender=this.living(other)[0];if(defender)this.hurt(other,this.damage(p,defender,1.6),null,defender.id)}else throw Error('Nessun bersaglio a portata.');break}
   case 'potion':{if(now<p.potionUntil)throw Error('Attendi prima di usare un’altra pozione.');if(!p.potions)throw Error('Pozioni esaurite.');if(this.members(p).every(c=>c.hp===stats(c).hp))throw Error('La squadra è già in piena salute.');p.potions--;p.potionUntil=now+5000;for(const c of this.members(p))c.hp=Math.min(stats(c).hp,c.hp+55);break}
   case 'team':{if(!this.atBase(p))throw Error('Cambia formazione alla base.');if(!Array.isArray(cmd.ids)||!cmd.ids.length||cmd.ids.length>3||new Set(cmd.ids).size!==cmd.ids.length||cmd.ids.some(id=>!p.creatures.some(c=>c.id===id)))throw Error('Formazione non valida.');p.team=cmd.ids;p.target=null;p.dest=null;break}
   case 'build':{if(!BUILDINGS.some(b=>b.id===cmd.id))throw Error('Edificio non valido.');if(p.buildJob)throw Error('Una costruzione è già in corso.');const l=p.buildings[cmd.id];if(l>=10)throw Error('Livello massimo raggiunto.');if(cmd.id!=='hq'&&l>=p.buildings.hq+1)throw Error('Migliora prima il Centro operativo.');this.pay(p,this.buildCost(p,cmd.id));p.buildJob={id:cmd.id,start:now,end:now+(20+l*10)*1000};break}
   case 'research':{if(!RESEARCH.some(r=>r.id===cmd.id))throw Error('Ricerca non valida.');if(p.researchJob)throw Error('Una ricerca è già in corso.');if(p.research[cmd.id]>=p.buildings.lab*2)throw Error('Migliora il Laboratorio per continuare.');this.pay(p,this.researchCost(p,cmd.id));p.researchJob={id:cmd.id,start:now,end:now+(25+p.research[cmd.id]*15)*1000};break}
   case 'buy':{if(cmd.id==='ball'){this.pay(p,{credits:30});p.balls++}else if(cmd.id==='potion'){this.pay(p,{food:70});p.potions++}else throw Error('Oggetto non valido.');break}
   case 'market':{if(!['materials','food','energy'].includes(cmd.resource)||!['buy','sell'].includes(cmd.side))throw Error('Scambio non valido.');if(cmd.side==='buy'){if(p.resources[cmd.resource]+100>this.cap(p))throw Error('Magazzino pieno.');this.pay(p,{credits:80});p.resources[cmd.resource]+=100}else{this.pay(p,{[cmd.resource]:100});p.resources.credits+=40}break}
   case 'claim':{const q=QUESTS.find(q=>q.id===cmd.id);if(!q||p.progress[q.id]<q.goal||p.claimed.includes(q.id))throw Error('Premio non disponibile.');p.claimed.push(q.id);this.reward(p,q.reward);this.notify(p,'Incarico completato: '+q.name);break}
   case 'pvp':if(typeof cmd.enabled!=='boolean')throw Error('Scelta non valida.');if(!cmd.enabled&&p.target&&this.players[p.target])throw Error('Rientra dalla frontiera per disattivare PvP.');if(!cmd.enabled&&this.frontier(p)&&Object.values(this.players).some(o=>o.target===p.id))throw Error('Non puoi disattivare PvP durante un attacco.');p.pvp=cmd.enabled;break;
   case 'chat':{if(typeof cmd.text!=='string'||!cmd.text.trim()||cmd.text.length>240)throw Error('Messaggio da 1 a 240 caratteri.');if(p.lastChat&&now-p.lastChat<1200)throw Error('Attendi un istante prima di scrivere ancora.');if(cmd.channel==='alliance'&&!p.alliance)throw Error('Non appartieni a un’alleanza.');p.lastChat=now;this.chat.push({id:randomUUID(),name:p.name,text:cmd.text.trim(),time:now,alliance:cmd.channel==='alliance'?p.alliance:null});this.chat=this.chat.slice(-100);break}
   case 'alliance':{if(cmd.action==='leave'){if(p.alliance){const a=this.alliances[p.alliance];p.alliance=null;if(a&&!Object.values(this.players).some(o=>o.alliance===a.id))delete this.alliances[a.id]}}else if(cmd.action==='create'){if(p.alliance)throw Error('Lascia prima l’alleanza attuale.');if(typeof cmd.name!=='string'||cmd.name.trim().length<3||cmd.name.trim().length>24)throw Error('Nome alleanza: 3–24 caratteri.');if(Object.values(this.alliances).some(a=>a.name.toLowerCase()===cmd.name.trim().toLowerCase()))throw Error('Nome alleanza già usato.');const id=randomUUID();this.alliances[id]={id,name:cmd.name.trim()};p.alliance=id}else if(cmd.action==='join'){if(p.alliance)throw Error('Lascia prima l’alleanza attuale.');if(!this.alliances[cmd.id])throw Error('Alleanza inesistente.');if(Object.values(this.players).filter(o=>o.alliance===cmd.id).length>=20)throw Error('Alleanza piena.');p.alliance=cmd.id}else throw Error('Azione non valida.');break}
   default:throw Error('Comando sconosciuto.');
  }p.updated=now;
 }
 tick(now=Date.now()){
  const dt=clamp((now-this.last)/1000,0,2);this.last=now;
  for(const e of this.enemies){if(e.hp<=0&&now>=e.respawn){if(!e.boss){const pool=this.spawnPool(e.biome);e.species=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))].id;e.maxHp=stats({species:e.species,level:e.level}).hp}e.hp=e.maxHp;e.respawn=0;e.x=e.home.x;e.y=e.home.y;e.participants={}}}
  for(const n of this.nodes){if(!n.amount&&now>=n.respawn)n.amount=300}
  for(const p of Object.values(this.players)){
   this.accrue(p,dt);this.finishJobs(p,now);p.updated=now;
   if(this.atBase(p)&&!p.target)for(const c of this.members(p))c.hp=Math.min(stats(c).hp,c.hp+dt*9);
   if(!p.online){p.target=null;p.dest=null;continue}
   let e=this.enemies.find(e=>e.id===p.target&&e.hp>0);let n=this.nodes.find(n=>n.id===p.target&&n.amount>0);let other=this.players[p.target];
   if(other&&(!p.pvp||!other.pvp||!other.online||!this.frontier(p)||!this.frontier(other))){p.target=null;other=null}
   const objective=e||n||other||p.dest;
   if(p.target&&!e&&!n&&!other)p.target=null;
   if(objective){const d=dist(p,objective),stop=p.dest?3:55;if(d>stop){const step=Math.min(d-stop,dt*120);p.x+=(objective.x-p.x)/d*step;p.y+=(objective.y-p.y)/d*step}else if(p.dest)p.dest=null;
    if(e&&d<=80&&p.mode==='study'){p.studyStart??=now;if(now-p.studyStart>=7000){if(!p.observed.includes(e.species)){p.observed.push(e.species);p.progress.studies++;this.reward(p,{credits:40,energy:25});p.prestige+=5;this.xp(p,10);this.notify(p,'Studio di '+species(e.species).name+' completato: dati registrati, +40 crediti e +25 energia.')}p.target=null;p.mode=null;p.studyStart=null}}
    if(e&&p.mode!=='study'&&p.target&&d<=80&&now-p.lastAttack>=1100&&this.living(p).length){p.lastAttack=now;const dealt=Math.min(e.hp,this.damage(p,e));e.participants[p.id]=(Number(e.participants[p.id])||0)+dealt;e.hp=Math.max(0,e.hp-dealt);this.defeatEnemy(e,p)}
    if(n&&d<=65&&now-(p.lastGather||0)>1500){p.lastGather=now;const amount=Math.min(n.amount,Math.round(35*(1+p.research.gather*.2)),Math.floor(this.cap(p)-p.resources[n.resource]));if(amount>0){n.amount-=amount;p.resources[n.resource]+=amount;if(p.gatherNode!==n.id){p.progress.gathers++;p.gatherNode=n.id}if(!n.amount){n.respawn=now+45000;p.target=null;p.gatherNode=null;this.notify(p,'Giacimento esaurito. Risorse raccolte.')}}else{p.target=null;this.notify(p,'Magazzino pieno. Migliora il Centro operativo.')}}
    if(other&&d<=80&&now-p.lastAttack>=1100){p.lastAttack=now;const defender=this.living(other)[0];if(defender)this.hurt(other,this.damage(p,defender),null,defender.id);if(defender&&!other.pvp){p.prestige+=20;p.target=null;this.notify(p,'Duello vinto! +20 prestigio.')}}
   }
  }
  for(const e of this.enemies.filter(e=>e.hp>0)){const attackers=Object.values(this.players).filter(p=>p.online&&p.mode!=='study'&&p.target===e.id&&dist(p,e)<90);if(!attackers.length&&!e.boss){const phase=Number(e.id.split('-')[1])||0;e.x=e.home.x+Math.sin(now/7000+phase)*18;e.y=e.home.y+Math.cos(now/9000+phase)*12}if(attackers.length&&now-e.lastAttack>1500){e.lastAttack=now;for(const p of attackers)this.hurt(p,e.boss?24:6+e.level*2,species(e.species).types[0])}}
 }
 snapshot(p){
  return {time:Date.now(),world:{width:1600,height:1000,enemies:this.enemies.map(({participants,home,...e})=>e),nodes:this.nodes,players:Object.values(this.players).filter(o=>o.online||o.id===p.id).map(o=>({id:o.id,name:o.name,x:o.x,y:o.y,base:o.base,pvp:o.pvp,alliance:o.alliance,team:this.members(o).map(c=>({species:c.species,level:c.level,hp:c.hp,maxHp:stats(c).hp}))}))},me:{...p,capacity:this.capacity(p),cap:this.cap(p),rates:this.rates(p),creatures:p.creatures.map(c=>({...c,...{maxHp:stats(c).hp},speciesData:species(c.species)})),buildCosts:Object.fromEntries(BUILDINGS.map(b=>[b.id,this.buildCost(p,b.id)])),researchCosts:Object.fromEntries(RESEARCH.map(r=>[r.id,this.researchCost(p,r.id)]))},alliances:Object.values(this.alliances).map(a=>({...a,members:Object.values(this.players).filter(o=>o.alliance===a.id).length})),ranking:Object.values(this.players).sort((a,b)=>b.prestige-a.prestige).slice(0,30).map(o=>({id:o.id,name:o.name,prestige:o.prestige,collection:o.creatures.length,alliance:this.alliances[o.alliance]?.name||'—'})),chat:this.chat.filter(c=>!c.alliance||c.alliance===p.alliance).slice(-35)};
 }
}



