import {randomUUID} from 'node:crypto';
import {Game,SPECIES,stats} from './game.mjs';
import {effectiveness} from './type-data.mjs';

export const BIOMES={forest:{name:'Bosco',icon:'♧',types:['erba','coleottero','veleno','folletto'],resource:'food'},grass:{name:'Prateria',icon:'❧',types:['normale','volante','elettro'],resource:'food'},mountain:{name:'Alture',icon:'⛰',types:['roccia','terra','lotta','acciaio'],resource:'materials'},wetland:{name:'Palude',icon:'♒',types:['acqua','veleno','spettro'],resource:'energy'},lake:{name:'Lago',icon:'≈',types:['acqua','ghiaccio'],resource:'energy'},ruins:{name:'Rovine',icon:'♜',types:['psico','drago','fuoco'],resource:'materials'}};
export const MISSIONS={survey:{name:'Ricognizione',work:30000,food:10,desc:'Rivela gli incontri e documenta il territorio.'},study:{name:'Studio sul campo',work:60000,food:15,desc:'Studia una specie senza combattere.'},capture:{name:'Cattura',work:90000,food:25,desc:'Affronta un incontro e tenta una cattura automatica.'},gather:{name:'Raccolta',work:120000,food:15,desc:'Preleva risorse dalla casella e riportale alla base.'},battle:{name:'Contenimento',work:90000,food:20,desc:'Affronta gli incontri della casella e ottieni esperienza.'}};
const special=['articuno','zapdos','moltres','mewtwo','mew'];
const byId=id=>SPECIES.find(s=>s.id===id);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const tileKey=(x,y)=>`${x}:${y}`;
const MAP_RADIUS = 16;
const legendarySites = [[-9,-9],[9,-9],[9,0],[9,9],[-9,0]];
const baseSites = [];
for (let y = 6; y >= -6; y -= 3) {
 for (let x = -6; x <= 6; x += 3) baseSites.push({x,y});
}
for (let y = 15; y >= -15; y -= 3) {
 for (let x = -15; x <= 15; x += 3) {
  if (Math.abs(x) <= 6 && Math.abs(y) <= 6) continue;
  if (legendarySites.some(([lx,ly]) => lx === x && ly === y)) continue;
  baseSites.push({x,y});
 }
}

function preparedSave(saved,now){if(!saved)return null;const s=structuredClone(saved);for(const p of Object.values(s.players||{})){p.updated=now;p.buildJob=null;p.researchJob=null}return s}

export class StrategicGame extends Game{
 constructor(saved=null,options={}){
  const now=Date.now();super(preparedSave(saved,now),options);this.tiles={...this.generateTiles(),...(saved?.strategyVersion===1 ? structuredClone(saved.tiles) : {})};
  for (const {x,y} of baseSites) {
   for (const key of [tileKey(x+1,y),tileKey(x,y-1)]) this.tiles[key].difficulty = 1;
  }
  let index=0;for(const p of Object.values(this.players)){const original=saved.players[p.id];p.buildJob=original.buildJob;p.researchJob=original.researchJob;p.updated=original.updated||now;this.initialize(p,index++,saved?.strategyVersion===1);}
  this.worldSpeed=options.speed||1;this.tick(now);
 }
 initialize(p,index,preserve=false){
  if(!preserve||!p.baseTile){p.baseTile=this.freeBase();p.mission=null;p.reports=[];p.discovered=[]}
  p.discovered??=[];p.reports??=[];p.observed??=[];p.mission??=null;p.progress.surveys??=0;
  p.base={...p.baseTile};p.x=p.base.x;p.y=p.base.y;p.dest=null;p.target=null;p.mode=null;p.studyStart=null;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=tileKey(p.baseTile.x+dx,p.baseTile.y+dy);if(this.tiles[k]&&!p.discovered.includes(k))p.discovered.push(k)}
 }
 freeBase() {
  const occupied = new Set(Object.values(this.players).filter(p => p.baseTile).map(p => tileKey(p.baseTile.x,p.baseTile.y)));
  return baseSites.find(({x,y}) => !occupied.has(tileKey(x,y)));
 }
 generateTiles(){
  const tiles={};for(let y=-MAP_RADIUS;y<=MAP_RADIUS;y++)for(let x=-MAP_RADIUS;x<=MAP_RADIUS;x++){
   let seed=((x+31)*73856093^(y+31)*19349663)>>>0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
   const n=rand(),biome=y<-4&&x>2?'mountain':x>=2&&x<=4?(n>.4?'lake':'wetland'):x<-1&&y<3?(n>.22?'forest':'grass'):n<.15?'ruins':n<.35?'forest':n<.55?'mountain':'grass';
   const pool=SPECIES.filter(s=>!special.includes(s.id)&&s.types.some(t=>BIOMES[biome].types.includes(t)));
   const encounters=[];for(let i=0;i<3;i++){const s=pool[Math.floor(rand()*pool.length)];if(!encounters.includes(s.id))encounters.push(s.id)}
   tiles[tileKey(x,y)]={x,y,biome,difficulty:1+Math.floor(Math.hypot(x+6,y-6)/4),encounters,stock:300,renewAt:0};
  }
  // Incontri introduttivi accessibili attorno al primo avamposto, non una schiera sulla mappa.
  tiles['-5:6'].encounters=['caterpie','pidgey','rattata'];tiles['-5:6'].difficulty=1;
  tiles['-6:5'].encounters=['oddish','weedle','bellsprout'];tiles['-6:5'].difficulty=1;
  special.forEach((id,i)=>{const [x,y]=legendarySites[i];tiles[tileKey(x,y)].encounters=[id];tiles[tileKey(x,y)].difficulty=9});
  return tiles;
 }
 create(name,starter){if(!this.freeBase())throw Error('Tutti gli avamposti del regno sono occupati.');const result=super.create(name,starter);this.initialize(result.p,Object.keys(this.players).length-1);return result}
 serialize(){return{...super.serialize(),strategyVersion:1,tiles:this.tiles}}
 atBase(p){return !p.mission}
 speed(p){const members=this.members(p),slowest=Math.min(...members.map(c=>byId(c.species).baseStats.speed));return Math.max(.04,.06+slowest/2000)}
 travel(p,tile){return Math.max(10000,Math.ceil(Math.hypot(tile.x-p.baseTile.x,tile.y-p.baseTile.y)/this.speed(p)*1000))}
 report(p,mission,result,now){const report={id:randomUUID(),missionId:mission.id,type:mission.type,squad:mission.squad||'alpha',coords:{...mission.destination},time:now,...result};p.reports.unshift(report);p.reports=p.reports.slice(0,60);this.notify(p,result.title);return report}
 dispatch(p,cmd,now){
  if(p.mission)throw Error('La squadra è già impegnata. Attendi il rientro o richiamala.');
  if(!MISSIONS[cmd.kind])throw Error('Tipo di spedizione non valido.');
  if(!Number.isInteger(cmd.x)||!Number.isInteger(cmd.y))throw Error('Coordinate non valide.');
  const key=tileKey(cmd.x,cmd.y),tile=this.tiles[key];if(!tile)throw Error('Casella fuori dai confini.');
  if(Object.values(this.players).some(o=>o.baseTile?.x===cmd.x&&o.baseTile?.y===cmd.y))throw Error('Gli avamposti sono protetti. Seleziona una casella selvatica.');
  if(cmd.kind!=='survey'&&!p.discovered.includes(key))throw Error('Esegui prima una ricognizione della casella.');
  if(['study','capture'].includes(cmd.kind)&&!tile.encounters.includes(cmd.species))throw Error('Scegli una specie presente nell’habitat.');
  if(cmd.kind==='study'&&p.observed.includes(cmd.species))throw Error('Specie già documentata tramite studio.');
  if(cmd.kind==='capture'&&(p.balls<1||p.creatures.length>=this.capacity(p)))throw Error(p.balls<1?'Poké Ball esaurite.':'Habitat pieno.');
  if(!this.living(p).length)throw Error('Cura la squadra prima della partenza.');
  this.pay(p,{food:MISSIONS[cmd.kind].food});if(cmd.kind==='capture')p.balls--;
  const travel=this.travel(p,tile),work=MISSIONS[cmd.kind].work;
  p.mission={id:randomUUID(),type:cmd.kind,species:['study','capture'].includes(cmd.kind)?cmd.species:null,origin:{...p.baseTile},destination:{x:cmd.x,y:cmd.y},phase:'outbound',departAt:now,arriveAt:now+travel,completeAt:now+travel+work,returnAt:now+travel*2+work,travel,roster:structuredClone(this.members(p)),result:null};
  this.notify(p,`${MISSIONS[cmd.kind].name} partita verso (${cmd.x}|${cmd.y}).`);
 }
 resolve(p,m,now){
  const tile=this.tiles[tileKey(m.destination.x,m.destination.y)];let result={title:'Spedizione completata',text:'Operazione conclusa.',resources:{},xp:0,prestige:0,captured:null,success:true};
  const living=m.roster.filter(c=>c.hp>0),enemy=byId(m.species||tile.encounters[0]);
  const attack=living.reduce((sum,c)=>{const s=byId(c.species),eff=Math.max(...s.types.map(t=>effectiveness(t,enemy.types)));return sum+stats(c).atk*(1+p.research.attack*.08)*eff},0);
  const defense=18+tile.difficulty*10,strength=attack/defense;
  if(m.type==='survey'){
   const key=tileKey(tile.x,tile.y),fresh=!p.discovered.includes(key);if(fresh){p.discovered.push(key);p.progress.surveys++}
   result={...result,title:'Rapporto di ricognizione',text:`Habitat ${BIOMES[tile.biome].name.toLowerCase()}: rilevati ${tile.encounters.map(id=>byId(id).name).join(', ')}. Riserve: ${tile.stock}.`,resources:fresh?{credits:30,energy:15}:{},xp:fresh?8:0,prestige:fresh?3:0};
  }else if(m.type==='study'){
   const fresh=!p.observed.includes(m.species);if(fresh){p.observed.push(m.species);p.progress.studies++}
   result={...result,title:'Studio di '+enemy.name,text:`Osservazione non invasiva completata. Tipi: ${enemy.types.join(' / ')}. La specie è documentata nel registro scientifico.`,resources:fresh?{credits:40,energy:25}:{},xp:fresh?12:0,prestige:fresh?5:0};
  }else if(m.type==='gather'){
   const amount=Math.min(tile.stock,Math.round(90*(1+p.research.gather*.2)*living.length));tile.stock-=amount;if(tile.stock<300&&!tile.renewAt)tile.renewAt=now+120000;
   if(amount)p.progress.gathers++;result={...result,title:'Rapporto di raccolta',text:amount?'Carico acquisito. Le risorse saranno disponibili al rientro.':'Il giacimento è esaurito: nessuna risorsa raccolta.',resources:{[BIOMES[tile.biome].resource]:amount},xp:amount?8:0,prestige:amount?2:0};
  }else if(m.type==='capture'){
   const chance=clamp(.35+strength*.25+p.research.capture*.05,.1,.92),success=this.random()<chance;result.success=success;
   result={...result,title:success?enemy.name+' catturato':'Tentativo di cattura fallito',text:`Probabilità ${Math.round(chance*100)}%. Una Poké Ball utilizzata. ${success?'Il nuovo esemplare raggiungerà l’Habitat con la squadra.':'La squadra rientra senza un nuovo esemplare.'}`,xp:success?25:8,prestige:success?15:0,captured:success?{species:enemy.id,level:tile.difficulty}:null};
   this.injure(p,m,Math.round(9+tile.difficulty*5-Math.min(12,strength*4)));if(success)p.progress.captures++;
  }else if(m.type==='battle'){
   const chance=attack===0?0:clamp(.2+strength*.55,.05,.96),success=this.random()<chance;result={...result,success,title:success?'Contenimento riuscito':'Squadra in ripiegamento',text:`Confronto con ${enemy.name}. Esito risolto sul server in base a squadra, tipi e difficoltà. Nessuna perdita permanente dei Pokémon.`,resources:success?{credits:40+tile.difficulty*12,materials:35+tile.difficulty*10}:{},xp:success?25+tile.difficulty*5:10,prestige:success?12:0};this.injure(p,m,success?8+tile.difficulty*3:25+tile.difficulty*6);if(success)p.progress.victories++;
  }
  m.result=result;m.phase='returning';this.report(p,m,result,now);
 }
 injure(p,m,damage){for(const entry of m.roster){const c=p.creatures.find(c=>c.id===entry.id);if(c)c.hp=Math.max(1,c.hp-Math.max(0,damage))}}
 missionSlot(m){return 'mission'}
 activeMissions(p){return p.mission ? [p.mission] : []}
 complete(p,m,now){
  const slot = this.missionSlot(m);
  const result = m.result;
  if (result) {
   this.reward(p, result.resources || {});
   const participants = p.creatures.filter(c => m.roster.some(member => member.id === c.id));
   this.xp(p, result.xp || 0, participants);
   p.prestige += result.prestige || 0;
   if (result.captured) {
    const creature = {id:randomUUID(), species:result.captured.species, level:result.captured.level, xp:0, hp:0};
    creature.hp = stats(creature).hp;
    p.creatures.push(creature);
    if (slot === 'mission' && p.team.length < 3) p.team.push(creature.id);
   }
  }
  const report = p.reports.find(r => r.missionId === m.id);
  if (report) {report.returned = true;report.returnedAt = now}
  p[slot] = null;
  this.notify(p, `Squadra ${m.squad === 'beta' ? 'Beta' : 'Alfa'} rientrata all’avamposto. Carico e ricompense consegnati.`);
 }
 command(p,cmd,now=Date.now()){
  this.tick(now);
  if(cmd?.type==='dispatch'){this.dispatch(p,cmd,now);return}
  if(cmd?.type==='recall'){
   const m=p.mission;if(!m||m.phase==='returning')throw Error('Nessuna spedizione richiamabile.');
   const elapsed=Math.min(m.travel,Math.max(1000,now-m.departAt));if(m.type==='capture')p.balls++;m.phase='returning';m.returnAt=now+elapsed;m.result={title:'Spedizione richiamata',text:'Operazione interrotta. Il cibo di viaggio è stato consumato.',resources:{},xp:0,prestige:0,captured:null,success:false};this.report(p,m,m.result,now);return;
  }
  if(['move','target','capture','skill','study','retreat','pvp'].includes(cmd?.type))throw Error('Usa la mappa territoriale e il comando Invia spedizione.');
  if(['team','potion'].includes(cmd?.type)&&p.mission)throw Error('La squadra deve rientrare prima di questa operazione.');
  return super.command(p,cmd,now);
 }
 missionDue(m){return m.phase==='outbound'?m.arriveAt:m.phase==='onsite'?m.completeAt:m.returnAt}
 advanceTerrain(now){for(const tile of Object.values(this.tiles))if(tile.renewAt&&now>=tile.renewAt){tile.stock=300;tile.renewAt=0}}
 accrueUntil(now){for(const p of Object.values(this.players)){const elapsed=Math.max(0,(now-p.updated)/1000);if(elapsed){this.accrue(p,Math.min(elapsed,86400));if(!p.mission)for(const c of this.members(p))c.hp=Math.min(stats(c).hp,c.hp+elapsed*9);p.updated=now}}}
 tick(now=Date.now()){
  if(!this.tiles)return;
  for(let i=0;i<5000;i++){
   const events=[];for(const p of Object.values(this.players)){if(p.buildJob)events.push({time:p.buildJob.end,p,kind:'job'});if(p.researchJob)events.push({time:p.researchJob.end,p,kind:'job'});if(p.craftJob)events.push({time:p.craftJob.end,p,kind:'job'});for(const mission of this.activeMissions(p))events.push({time:this.missionDue(mission),p,kind:'mission',mission})}
   const next=events.filter(e=>e.time<=now).sort((a,b)=>a.time-b.time||a.p.id.localeCompare(b.p.id))[0];if(!next)break;
   this.accrueUntil(next.time);this.advanceTerrain(next.time);const p=next.p;if(next.kind==='job')this.finishJobs(p,next.time);else{const m=next.mission;if(m.phase==='outbound'){m.phase='onsite';this.notify(p,`Squadra ${m.squad==='beta'?'Beta':'Alfa'} arrivata: ${MISSIONS[m.type].name} in corso.`)}else if(m.phase==='onsite')this.resolve(p,m,next.time);else this.complete(p,m,next.time)}
  }
  this.accrueUntil(now);this.advanceTerrain(now);
 }
 nextEventAt(){const events=[];for(const p of Object.values(this.players)){if(p.buildJob)events.push(p.buildJob.end);if(p.researchJob)events.push(p.researchJob.end);for(const mission of this.activeMissions(p))events.push(this.missionDue(mission))}for(const tile of Object.values(this.tiles))if(tile.renewAt)events.push(tile.renewAt);return events.length?Math.min(...events):null}
 snapshot(p){const snapshot=super.snapshot(p);const owners=new Map(Object.values(this.players).map(o=>[tileKey(o.baseTile.x,o.baseTile.y),o]));
  snapshot.world={size:2*MAP_RADIUS+1,min:-MAP_RADIUS,max:MAP_RADIUS,tiles:Object.values(this.tiles).map(t=>{const owner=owners.get(tileKey(t.x,t.y)),known=p.discovered.includes(tileKey(t.x,t.y));return{x:t.x,y:t.y,biome:t.biome,difficulty:t.difficulty,known,resource:BIOMES[t.biome].resource,stock:known?t.stock:null,encounters:known?t.encounters:[],owner:owner?{id:owner.id,name:owner.name,alliance:owner.alliance}:null}}),players:Object.values(this.players).map(o=>({id:o.id,name:o.name,baseTile:o.baseTile,online:o.online,alliance:o.alliance}))};
  snapshot.me={...snapshot.me,mission:p.mission,reports:p.reports,baseTile:p.baseTile,discovered:p.discovered,travelSpeed:this.speed(p)};snapshot.missionTypes=MISSIONS;snapshot.biomes=BIOMES;return snapshot;
 }
}
