import {advanceHabitat, collectSample, consumePopulation, consumeStock, fieldSample, gatheringSite, habitatAvailability, populationCount} from './habitat.mjs';
import {ROLES,TALENTS,normalizeWorkforce,facilityState,facilitySpeed,facilityBonus,laborCost,rollTalent,describeTalent,expeditionBonus,compatible,workSlots} from './workforce.mjs';
import {randomUUID} from 'node:crypto';
import {StrategicGame,MISSIONS} from './strategic.mjs';
import {SPECIES,stats} from './game.mjs';
import {effectiveness} from './type-data.mjs';
import {PlayerMarket} from './commerce.mjs';
import {AllianceDevelopment} from './alliance-development.mjs';
import {BALANCE_VERSION,BUILDINGS,RESEARCH,RECIPES,MISSION_REQUIREMENTS,BETA_REQUIREMENTS,buildingRequirements,scaledCost,energyState,hourlyRates,RESOURCE_LABELS} from './balance.mjs';
const species=id=>SPECIES.find(s=>s.id===id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class CampaignGame extends StrategicGame{
 constructor(saved=null,options={}){
  super(saved,options);
  this.worldSpeed=options.speed||1;
  this.profile=this.worldSpeed===1?'live':'sandbox';
  this.playerMarket=new PlayerMarket(this,saved?.commerce);
  this.allianceDevelopment=new AllianceDevelopment(this,saved?.allianceDevelopment,saved?.allianceProjects);
  this.playerMarket.advance(Date.now());
 }
 serialize(){return {...super.serialize(),commerce:this.playerMarket.serialize(),allianceDevelopment:this.allianceDevelopment.records}}
 tick(now=Date.now()){
  super.tick(now);
  this.playerMarket?.advance(now);
 }
 get speedFactor(){return this.worldSpeed||1}
 initialize(p,index,preserve=false){
  super.initialize(p,index,preserve);
  const fresh=this.creating;
  p.buildings={...Object.fromEntries(BUILDINGS.map(b=>[b.id,0])),...p.buildings};p.research={...Object.fromEntries(RESEARCH.map(r=>[r.id,0])),...p.research};
  if(fresh){for(const b of BUILDINGS)p.buildings[b.id]=['hq','quarry','farm','generator'].includes(b.id)?1:0;for(const r of RESEARCH)p.research[r.id]=0;p.resources={materials:550,food:350,reagents:100,credits:200};p.balls=3;p.potions=2;}
  if(p.balanceVersion!==BALANCE_VERSION)p.resources.reagents=(Number(p.resources.reagents)||0)+(Number(p.resources.energy)||0);
  delete p.resources.energy;p.productionSettings={quarry:100,farm:100,refinery:100,generator:100,...p.productionSettings};p.equipment??={};p.craftJob??=null;
  if(p.balanceVersion!==BALANCE_VERSION){p.balanceVersion=BALANCE_VERSION;this.notify(p,'Economia aggiornata: l’energia è potenza disponibile. La precedente scorta è stata convertita in reagenti. I progressi sono conservati.');}
  p.team=p.team.slice(0,this.teamLimit(p));normalizeWorkforce(p);
 }
 create(name,starter){this.creating=true;try{return super.create(name,starter)}finally{this.creating=false}}
 capacity(p){return 3+9*(p.buildings.habitat||0)}
 teamLimit(p){return Math.min(3,1+Math.floor((p.buildings.habitat||0)/2))}
 cap(p){return Math.floor(2000*(1+(1.7**(p.buildings.warehouse||0)-1)*facilityState(p,'warehouse').coverage)*(1+facilityBonus(p,'warehouse','yield')))}
 rates(p){return Object.fromEntries(Object.entries(hourlyRates(p)).map(([r,n])=>[r,n/3600*this.speedFactor]))}
 accrue(p,seconds){for(const[r,v]of Object.entries(this.rates(p))){const current=p.resources[r]||0;p.resources[r]=Math.max(current,Math.min(this.cap(p),current+v*seconds))}}
 reward(p,reward){const normalized={...reward};if(normalized.energy){normalized.reagents=(normalized.reagents||0)+normalized.energy;delete normalized.energy}for(const[r,n]of Object.entries(normalized))if(Object.hasOwn(RESOURCE_LABELS,r)){const current=p.resources[r]||0;p.resources[r]=Math.max(current,Math.min(r==='credits'?1e9:this.cap(p),current+n))}}
 pay(p,cost){if(Object.entries(cost).some(([r,n])=>!Object.hasOwn(RESOURCE_LABELS,r)||!Number.isFinite(n)||n<0||(p.resources[r]||0)<n))throw Error('Risorse insufficienti.');for(const[r,n]of Object.entries(cost))p.resources[r]-=n}
 buildCost(p,id){const b=BUILDINGS.find(b=>b.id===id);return b?laborCost(p,'hq',scaledCost(b.base,b.factor,p.buildings[id]||0)):{}}
 researchCost(p,id){const r=RESEARCH.find(r=>r.id===id);return r?laborCost(p,'lab',scaledCost(r.base,r.factor,p.research[id]||0)):{}}
 duration(kind,p,id){const c=(kind==='building'?BUILDINGS:RESEARCH).find(x=>x.id===id),level=kind==='building'?(p.buildings[id]||0):(p.research[id]||0);return Math.ceil(c.seconds*1.5**level/(1+.12*((kind==='building'?p.buildings.hq:p.buildings.lab)||0))*1000/this.speedFactor/this.jobSpeed(p,kind==='building'?'hq':'lab'))}
 allianceBonus(p,perk){return this.allianceDevelopment?.bonus(p,perk)??0}
 jobSpeed(p,id,quantity=1){return facilitySpeed(p,id,quantity)*(1+(id==='lab'?this.allianceBonus(p,'research'):0))}
 check(p,requirements={},power=0){const missing=[];for(const[kind,values]of Object.entries(requirements))for(const[id,level]of Object.entries(values)){const owned=p[kind]?.[id]||0;if(owned<level){const definition=(kind==='buildings'?BUILDINGS:RESEARCH).find(x=>x.id===id);missing.push(`${definition?.name||id} ${level} (attuale ${owned})`)}}if(power&&energyState(p).produced<power)missing.push(`Potenza installata ${power} (attuale ${energyState(p).produced})`);return{ok:missing.length===0,missing,requirements,power}}
 buildingLock(p,id){const next=(p.buildings[id]||0)+1,req=buildingRequirements(id,next),lock=this.check(p,req);if(next>20){lock.ok=false;lock.missing.push('Livello massimo 20 raggiunto.')}return lock}
 researchLock(p,id){const r=RESEARCH.find(r=>r.id===id),lock=this.check(p,r?.requirements,r?.power);if((p.research[id]||0)>=Math.min(20,(p.buildings.lab||0)*2)){lock.ok=false;lock.missing.push(`Laboratorio più avanzato: massimo ${Math.min(20,(p.buildings.lab||0)*2)} livelli.`)}return lock}
 recipeLock(p,id){return this.check(p,RECIPES.find(r=>r.id===id)?.requirements)}
 missionLock(p,kind){return this.check(p,MISSION_REQUIREMENTS[kind])}
 require(lock){if(!lock.ok)throw Error('Prerequisiti: '+lock.missing.join('; '))}
 countItem(p,id){return id==='ball'?p.balls:id==='potion'?p.potions:(p.equipment?.[id]||0)}
 addItem(p,id,amount){if(id==='ball')p.balls+=amount;else if(id==='potion')p.potions+=amount;else p.equipment[id]=(p.equipment[id]||0)+amount}
 itemDuration(p,recipe,quantity){return Math.ceil(recipe.seconds*quantity/(1+.15*((p.buildings[recipe.structure]||1)-1))*1000/this.speedFactor/this.jobSpeed(p,recipe.structure,quantity))}
 finishJobs(p,now){if(p.buildJob&&now>=p.buildJob.end){const id=p.buildJob.id;p.buildings[id]++;p.progress.upgrades++;p.buildJob=null;this.notify(p,BUILDINGS.find(b=>b.id===id).name+' migliorato!')}if(p.researchJob&&now>=p.researchJob.end){const id=p.researchJob.id;p.research[id]++;p.researchJob=null;this.notify(p,'Ricerca completata: '+RESEARCH.find(r=>r.id===id).name)}if(p.craftJob&&now>=p.craftJob.end){const job=p.craftJob;p.craftJob=null;this.addItem(p,job.id,job.quantity);this.notify(p,`${job.quantity} × ${RECIPES.find(r=>r.id===job.id).name} fabbricati.`)}}
 speed(p,roster=this.members(p)){return (1/(90/(1+Math.min(100,...roster.map(c=>species(c.species).baseStats.speed))/100)))*(1+.08*(p.research.logistics||0))*(1+.02*(p.buildings.observatory||0)*facilityState(p,'observatory').coverage)*this.speedFactor}
 travel(p,tile,roster){return Math.max(45000/this.speedFactor,Math.ceil(Math.hypot(tile.x-p.baseTile.x,tile.y-p.baseTile.y)/this.speed(p,roster)*1000))}
 missionFood(p,kind,tile,roster=this.members(p)){return MISSIONS[kind].food+Math.ceil(Math.hypot(tile.x-p.baseTile.x,tile.y-p.baseTile.y)*2)+roster.length*3}
 gatherUnitLoad(p){
  return 15 * (1 + .1 * (p.research.gather || 0)) * (1 + .08 * (p.buildings.depot || 0) * facilityState(p,'depot').coverage) * (1 + this.allianceBonus(p,'gather'));
 }
 gatherLoad(p,roster,tool,siteFactor=1){
  const living = roster.filter(c=>c.hp>0).length;
  const toolFactor = RECIPES.find(r=>r.id===tool)?.loadFactor ?? 1;
  return Math.round(this.gatherUnitLoad(p) * living * toolFactor * (1 + expeditionBonus(roster,'gather','gather')) * siteFactor);
 }
 missionSlot(m){return m.squad === 'beta' ? 'betaMission' : 'mission'}
 activeMissions(p){return [p.mission,p.betaMission].filter(Boolean)}
 betaLock(p){return this.check(p,BETA_REQUIREMENTS)}
 betaCandidates(p){return p.creatures.filter(c=>c.hp>0&&!c.assignment&&!p.team.includes(c.id))}
 inExpedition(p,id){return this.activeMissions(p).some(m=>m.roster.some(c=>c.id===id))}
 capturePlaces(p){
  const reserved = this.activeMissions(p).filter(m => m.type==='capture' && (!m.result || m.result.captured)).length;
  return Math.max(0,this.capacity(p)-p.creatures.length-reserved);
 }
 expeditionRoster(p,cmd){
  if (cmd.squad !== 'beta') return this.members(p);
  this.require(this.betaLock(p));
  const ids = cmd.roster;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 2 || new Set(ids).size !== ids.length) throw Error('Scegli uno o due Pokémon distinti per la Squadra Beta.');
  const available = this.betaCandidates(p);
  const roster = ids.map(id => available.find(c=>c.id===id));
  if (roster.some(c=>!c)) throw Error('La Squadra Beta può usare soltanto Pokémon disponibili in riserva.');
  return roster;
 }
 speciesTier(id){const s=species(id),sum=Object.values(s.baseStats).reduce((a,b)=>a+b,0);return ['articuno','zapdos','moltres','mewtwo','mew'].includes(id)?4:sum>=480?3:sum>=350?2:1}
 captureLock(p,id){const tier=this.speciesTier(id);return this.check(p,tier===1?{}:tier===2?{buildings:{hq:4},research:{capture:2,ecology:2}}:tier===3?{buildings:{hq:6},research:{capture:3,ecology:4}}:{buildings:{hq:9,lab:6},research:{capture:6,ecology:6}})}
 dispatch(p,cmd,now){
  const squad = cmd.squad ?? 'alpha';
  if (!['alpha','beta'].includes(squad)) throw Error('Squadra non valida.');
  const slot = this.missionSlot({squad});
  if(p[slot])throw Error('La squadra è già impegnata.');if(!Object.hasOwn(MISSIONS,cmd.kind))throw Error('Missione non valida.');this.require(this.missionLock(p,cmd.kind));
  const roster = this.expeditionRoster(p,cmd);
  if(!Number.isInteger(cmd.x)||!Number.isInteger(cmd.y))throw Error('Coordinate non valide.');const key=`${cmd.x}:${cmd.y}`,tile=this.tiles[key];if(!tile)throw Error('Casella fuori dai confini.');
  if(Object.values(this.players).some(o=>o.baseTile.x===cmd.x&&o.baseTile.y===cmd.y))throw Error('Gli avamposti sono protetti.');
  const distance=Math.hypot(cmd.x-p.baseTile.x,cmd.y-p.baseTile.y),radius=3+2*(p.buildings.observatory||0)+(p.research.logistics||0),difficulty=1+Math.floor(p.buildings.hq/2)+(p.research.cartography||0);
  if(distance>radius)throw Error(`Fuori raggio (${radius} caselle). Sviluppa Osservatorio e Logistica.`);if(tile.difficulty>difficulty)throw Error(`Difficoltà massima ${difficulty}. Sviluppa Centro operativo e Cartografia.`);
  if(cmd.kind!=='survey'&&!p.discovered.includes(key))throw Error('Esegui prima una ricognizione.');
  if(['study','capture'].includes(cmd.kind)&&!tile.encounters.includes(cmd.species))throw Error('Specie non presente nell’habitat.');if(cmd.kind==='study'&&p.observed.includes(cmd.species))throw Error('Specie già documentata.');
  if (['study', 'capture'].includes(cmd.kind) && !populationCount(tile, cmd.species)) throw Error('Popolazione esaurita. Attendi il ripopolamento o scegli un altro habitat.');
  if (cmd.kind === 'gather' && !tile.stock) throw Error('Riserva esaurita. Attendi la rigenerazione o scegli un’altra casella.');
  if (cmd.kind === 'battle' && !tile.encounters.some(id => populationCount(tile, id))) throw Error('Nessun Pokémon disponibile per il contenimento.');
  if(cmd.kind==='capture'){this.require(this.captureLock(p,cmd.species));if(!this.capturePlaces(p))throw Error('Nessun posto libero nell’Habitat per la cattura.');}
  const targetTypes=cmd.kind==='capture'?species(cmd.species).types:[];const talentType=cmd.kind==='capture'?(cmd.talentType||(targetTypes.length===1?targetTypes[0]:null)):null;if(cmd.kind==='capture'&&!targetTypes.includes(talentType))throw Error('Scegli il tipo dell’abilità prima della cattura.');
  const reservations=[],ball=cmd.ball||'ball',tool=cmd.tool||'';
  if(cmd.kind==='capture'){if(!['ball','greatBall','ultraBall'].includes(ball))throw Error('Ball non valida.');reservations.push(ball)}
  if (tool) {
   const recipe = RECIPES.find(r=>r.id===tool);
   if (recipe?.mission!==cmd.kind) throw Error('Strumento incompatibile con la missione.');
   reservations.push(tool);
  }
  for(const id of reservations)if(this.countItem(p,id)<1)throw Error('Strumento mancante: '+(RECIPES.find(r=>r.id===id)?.name||id));
  if (!roster.some(c=>c.hp>0)) throw Error('Prepara una squadra in salute.');
  const food = Math.ceil(this.missionFood(p,cmd.kind,tile,roster)*(1-expeditionBonus(roster,cmd.kind,'foodCost')));
  this.pay(p,{food});
  for (const id of reservations) this.addItem(p,id,-1);
  const travel = Math.ceil(this.travel(p,tile,roster)/(1+expeditionBonus(roster,cmd.kind,'travel')));
  const site = cmd.kind==='gather' ? gatheringSite(tile) : null;
  const work = Math.ceil(MISSIONS[cmd.kind].work * (site?.work ?? 1) / this.speedFactor / (1 + expeditionBonus(roster,cmd.kind,'work')));
  p[slot] = {
   id:randomUUID(), squad, type:cmd.kind, species:['study','capture'].includes(cmd.kind)?cmd.species:null,
   origin:{...p.baseTile}, destination:{x:cmd.x,y:cmd.y}, phase:'outbound', departAt:now,
   arriveAt:now+travel, completeAt:now+travel+work, returnAt:now+travel*2+work,
   travel, roster:structuredClone(roster), reservations, ball, tool, talentType, result:null
  };
  if (site) {
   p[slot].gatherLoad = this.gatherLoad(p,roster,tool,site.load);
   p[slot].siteName = site.name;
  }
  this.notify(p,`Squadra ${squad==='beta'?'Beta':'Alfa'} in partenza per ${MISSIONS[cmd.kind].name.toLowerCase()} (${cmd.x}|${cmd.y}).`);
 }
 resolve(p,m,now){
  const t=this.tiles[`${m.destination.x}:${m.destination.y}`];
  const target = m.species || t.encounters.find(id => populationCount(t, id));
  const needsPokemon = ['study', 'capture', 'battle'].includes(m.type);
  const empty = m.type === 'gather' ? !t.stock : needsPokemon && (!target || !populationCount(t, target));
  if (empty) {
   for (const item of m.reservations ?? []) this.addItem(p, item, 1);
   m.reservations = [];
   m.result = {
    title: 'Disponibilità esaurita',
    text: 'La riserva o la popolazione condivisa era esaurita al momento dell’operazione. Gli strumenti non usati sono stati restituiti. Il cibo di viaggio è stato consumato.',
    resources: {}, xp: 0, prestige: 0, captured: null, success: false
   };
   m.phase = 'returning';
   this.report(p, m, m.result, now);
   return;
  }
  const enemy = species(target), living = m.roster.filter(c => c.hp > 0);
  const attack = needsPokemon ? living.reduce((sum, c) => sum + stats(c).atk * (1 + .06 * (p.research.attack || 0)) * Math.max(...species(c.species).types.map(type => effectiveness(type, enemy.types))), 0) : 0;
  const strength = attack / (18 + t.difficulty * 12);
  let r={title:'Operazione conclusa',text:'',resources:{},xp:0,prestige:0,captured:null,success:true};
  if(m.type==='survey'){const key=`${t.x}:${t.y}`,fresh=!p.discovered.includes(key);if(fresh){p.discovered.push(key);p.progress.surveys++}if(m.tool==='scanner')for(let y=t.y-1;y<=t.y+1;y++)for(let x=t.x-1;x<=t.x+1;x++){const k=`${x}:${y}`;if(this.tiles[k]&&!p.discovered.includes(k))p.discovered.push(k)}r={...r,title:'Rapporto di ricognizione',text:`Popolazioni rilevate: ${t.encounters.map(id=>species(id).name+' ('+populationCount(t,id)+' presenti)').join(', ')}. Sito di raccolta: ${gatheringSite(t).name}. Riserva condivisa: ${t.stock} ${RESOURCE_LABELS[this.snapshotResource(t)].toLowerCase()}. ${m.tool==='scanner'?'Lo scanner ha rilevato anche le caselle adiacenti.':''}`,resources:fresh?{credits:20,reagents:8}:{},xp:fresh?5:0,prestige:fresh?3:0};}
  if(m.type==='study'){const fresh=!p.observed.includes(m.species);if(fresh){p.observed.push(m.species);p.progress.studies++}r={...r,title:'Studio di '+enemy.name,text:`Osservazione non invasiva. Tipi: ${enemy.types.join(' / ')}.`,resources:fresh?{credits:25,reagents:10}:{},xp:fresh?8:0,prestige:fresh?5:0};}
  if (m.type==='gather') {
   const resource = this.snapshotResource(t);
   const capacity = m.gatherLoad ?? this.gatherLoad(p,m.roster,m.tool);
   const amount = Math.min(t.stock,capacity);
   consumeStock(t,amount,now,this.speedFactor);
   const sample = amount > 0 ? collectSample(t,now,this.speedFactor) : null;
   const resources = {[resource]:amount};
   if (sample) resources[sample] = 1;
   if (amount) p.progress.gathers++;
   r = {...r,title:'Rapporto di raccolta',
    text:`${m.siteName ? m.siteName + '. ' : ''}Carico ${amount} su ${capacity} ${RESOURCE_LABELS[resource].toLowerCase()}. Riserva residua ${t.stock}. ${sample?'Campione raccolto: '+RESOURCE_LABELS[sample]+'. ':''}Consegna al rientro.`,
    resources,xp:amount?5:0,prestige:amount?2:0};
  }
  if(m.type==='capture'){const chance=clamp(.2+Math.min(.45,strength*.22)+.03*(p.research.capture||0)+(m.ball==='greatBall'?.08:m.ball==='ultraBall'?.15:0)+(RECIPES.find(recipe=>recipe.id===m.tool)?.captureBonus??0),.08,.92),success=this.random()<chance;r={...r,success,title:success?enemy.name+' catturato':'Cattura fallita',text:`Probabilità ${Math.round(chance*100)}%. Ball e strumenti utilizzati.`,captured:success?{species:enemy.id,level:t.difficulty}:null,xp:success?20:5,prestige:success?15:0};this.injure(p,m,8+t.difficulty*5);if(success)p.progress.captures++;}
  if(m.type==='battle'){const success=attack>0&&this.random()<clamp(.15+strength*.6,.05,.95);r={...r,success,title:success?'Contenimento riuscito':'Ripiegamento',text:`Confronto con ${enemy.name}. Tipi e composizione hanno determinato l’esito.`,resources:success?{materials:20+t.difficulty*6,credits:30+t.difficulty*10}:{},xp:success?20:5,prestige:success?12:0};this.injure(p,m,success?8+t.difficulty*3:20+t.difficulty*5);if(success)p.progress.victories++;}
  if(m.type==='study'){const bonus=expeditionBonus(m.roster,m.type,'studyReward');r.resources=Object.fromEntries(Object.entries(r.resources).map(([id,n])=>[id,Math.round(n*(1+bonus))]));}
  if(r.captured){consumePopulation(t,enemy.id,now,this.speedFactor);const type=m.talentType||enemy.types[0],talent=rollTalent(type,this.random,p.talentMisses[type]||0);r.captured.workTalent=talent;p.talentMisses[type]=talent.rank===2?0:(p.talentMisses[type]||0)+1;r.text+=' Abilità: '+describeTalent({...r.captured,workTalent:talent}).name+'.';}
  m.result=r;m.phase='returning';this.report(p,m,r,now);
 }
 snapshotResource(tile) {
  if (['lake', 'wetland'].includes(tile.biome)) return 'reagents';
  return ['forest', 'grass'].includes(tile.biome) ? 'food' : 'materials';
 }
 advanceTerrain(now) {
  for (const tile of Object.values(this.tiles)) {
   if (tile.renewAt || tile.populations || tile.sampleCache) advanceHabitat(tile, now, this.speedFactor);
  }
 }
 terrainAvailability(tiles) {
  for (const tile of tiles) {
   if (tile.known && !tile.owner) {
    const habitat = this.tiles[`${tile.x}:${tile.y}`];
    tile.availability = habitatAvailability(habitat);
    tile.site = gatheringSite(habitat);
    tile.sample = fieldSample(habitat);
   }
  }
 }
 workCommand(p,cmd,now){
  const jobs=()=>[[p.buildJob,'hq',1],[p.researchJob,'lab',1],[p.craftJob,RECIPES.find(r=>r.id===p.craftJob?.id)?.structure,p.craftJob?.quantity||1]];
  const before=jobs().filter(([job])=>job).map(([job,id,n])=>({job,id,n,speed:this.jobSpeed(p,id,n)}));
  if(cmd.type==='chooseTalent'){
   const c=p.creatures.find(c=>c.id===cmd.creatureId);if(!c)throw Error('Pokémon non posseduto.');if(c.workTalent)throw Error('Abilità già assegnata: non può essere estratta nuovamente.');
   if(this.inExpedition(p,c.id))throw Error('Attendi il rientro del Pokémon.');
   if(!species(c.species).types.includes(cmd.talentType))throw Error('Scegli uno dei tipi del Pokémon.');
   c.workTalent=rollTalent(cmd.talentType,this.random);this.notify(p,`${species(c.species).name}: ${describeTalent(c).name}.`);
  }else if(cmd.type==='assign'){
   const c=p.creatures.find(c=>c.id===cmd.creatureId);if(!c)throw Error('Pokémon non posseduto.');
   if(this.inExpedition(p,c.id))throw Error('Il Pokémon è in spedizione.');
   const id=cmd.structure;if(id!==null){
    if(typeof id!=='string'||!Object.hasOwn(ROLES,id)||!p.buildings[id])throw Error('Struttura non disponibile.');
    if(!compatible(c,id))throw Error('Tipo incompatibile con la mansione.');if(c.hp<=0)throw Error('Il Pokémon deve recuperare salute.');
    if(p.creatures.filter(other=>other.id!==c.id&&other.assignment===id).length>=workSlots(p,id))throw Error('Tutti i posti sono occupati.');
   }
   c.assignment=id;if(id)p.team=p.team.filter(cid=>cid!==c.id);
  }else{
   if(typeof cmd.structure!=='string'||!Object.hasOwn(ROLES,cmd.structure)||!p.buildings[cmd.structure]||!['service','auto'].includes(cmd.mode))throw Error('Modalità non valida.');
   if(cmd.mode==='auto'&&p.buildings.hq<2)throw Error('L’automazione richiede Centro operativo 2.');
   if(cmd.structure==='generator')throw Error('I pannelli solari sono già autonomi.');
   p.automationModules??={};if(cmd.mode==='auto'&&!p.automationModules[cmd.structure]){this.pay(p,this.automationCost(p,cmd.structure));p.automationModules[cmd.structure]=true;}
   p.workModes[cmd.structure]=cmd.mode;
  }
  for(const {job,id,n,speed} of before){const ratio=speed/this.jobSpeed(p,id,n);job.startedAt??=job.start;job.start=now-(now-job.start)*ratio;job.end=now+Math.max(1,Math.ceil((job.end-now)*ratio));}
 }
 automationCost(p,id){const level=p.buildings[id]||1;return{materials:80*level,reagents:20*level}}
 previewWork(p,cmd,now=Date.now()){
  if(!['assign','workMode'].includes(cmd?.type))throw Error('Anteprima non disponibile.');
  const copy=structuredClone(p);this.workCommand(copy,cmd,now);
  const describe=q=>({hourly:Object.fromEntries(Object.entries(this.rates(q)).map(([r,v])=>[r,v*3600])),power:energyState(q),team:q.team.length,jobs:Object.fromEntries(['buildJob','researchJob','craftJob'].filter(k=>q[k]).map(k=>[k,Math.max(0,q[k].end-now)]))});
  return{before:describe(p),after:describe(copy),cost:cmd.type==='workMode'&&cmd.mode==='auto'&&!p.automationModules?.[cmd.structure]?this.automationCost(p,cmd.structure):{}};
 }
 command(p,cmd,now=Date.now()){
  this.tick(now);
  if (cmd?.type==='allianceDonate') return this.allianceDevelopment.donate(p,cmd);
  if (cmd?.type==='trade') return this.playerMarket.command(p,cmd,now);
  if(['assign','workMode','chooseTalent'].includes(cmd?.type))return this.workCommand(p,cmd,now);
  if (cmd?.type==='team' && Array.isArray(cmd.ids)) {
   if (cmd.ids.some(id=>p.creatures.find(c=>c.id===id)?.assignment)) throw Error('Libera prima il Pokémon dalla mansione.');
   if (cmd.ids.some(id=>p.betaMission?.roster.some(c=>c.id===id))) throw Error('Il Pokémon è in spedizione con la Squadra Beta.');
  }
  if(cmd?.type==='build'&&cmd.id==='lab'&&p.researchJob)throw Error('Il Laboratorio sta eseguendo una ricerca.');
  if(cmd?.type==='research'&&p.buildJob?.id==='lab')throw Error('Attendi il completamento dei lavori al Laboratorio.');
  if(cmd?.type==='build'&&p.craftJob&&RECIPES.find(r=>r.id===p.craftJob.id)?.structure===cmd.id)throw Error('La struttura sta fabbricando strumenti.');
  if(cmd?.type==='craft'&&p.buildJob?.id===RECIPES.find(r=>r.id===cmd.id)?.structure)throw Error('La struttura richiesta è in costruzione.');
  if(cmd?.type==='production'){if(!['quarry','farm','refinery','generator'].includes(cmd.id)||!Number.isInteger(cmd.percent)||cmd.percent<0||cmd.percent>100||cmd.percent%10)throw Error('Produzione: scegli una percentuale da 0 a 100 a passi di 10.');p.productionSettings[cmd.id]=cmd.percent;return}
  if(cmd?.type==='build'){const b=BUILDINGS.find(b=>b.id===cmd.id);if(!b)throw Error('Edificio non valido.');this.require(this.buildingLock(p,b.id));if(p.buildJob)throw Error('Una costruzione è già in corso.');this.pay(p,this.buildCost(p,b.id));p.buildJob={id:b.id,start:now,end:now+this.duration('building',p,b.id)};return}
  if(cmd?.type==='research'){const r=RESEARCH.find(r=>r.id===cmd.id);if(!r)throw Error('Ricerca non valida.');this.require(this.researchLock(p,r.id));if(p.researchJob)throw Error('Una ricerca è già in corso.');this.pay(p,this.researchCost(p,r.id));p.researchJob={id:r.id,start:now,end:now+this.duration('research',p,r.id)};return}
  if(cmd?.type==='craft'){const recipe=RECIPES.find(r=>r.id===cmd.id);if(!recipe)throw Error('Ricetta non valida.');this.require(this.recipeLock(p,recipe.id));if(p.craftJob)throw Error('Una fabbricazione è già in corso.');const quantity=cmd.quantity??1;if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw Error('Quantità da 1 a 20.');const cost=Object.fromEntries(Object.entries(laborCost(p,recipe.structure,recipe.cost)).map(([r,n])=>[r,n*quantity]));this.pay(p,cost);p.craftJob={id:recipe.id,quantity,start:now,end:now+this.itemDuration(p,recipe,quantity)};return}
  if(cmd?.type==='buy')throw Error('Gli strumenti si fabbricano nelle strutture, non si acquistano subito.');
  if(cmd?.type==='market'){if(!['materials','food','reagents'].includes(cmd.resource)||!['buy','sell'].includes(cmd.side))throw Error('L’energia non è una merce. Scegli una risorsa immagazzinabile.');this.require(this.check(p,{buildings:{depot:1}}));const price=cmd.resource==='reagents'?{buy:120,sell:60}:{buy:80,sell:40};if(cmd.side==='buy'){if(p.resources[cmd.resource]+100>this.cap(p))throw Error('Magazzino pieno.');this.pay(p,{credits:price.buy});p.resources[cmd.resource]+=100}else{this.pay(p,{[cmd.resource]:100});p.resources.credits+=price.sell}return}
  if(cmd?.type==='team'&&cmd.ids?.length>this.teamLimit(p))throw Error(`Habitat insufficiente: ${this.teamLimit(p)} membri disponibili.`);
  if(cmd?.type==='recall'){const squad=cmd.squad??'alpha';if(!['alpha','beta'].includes(squad))throw Error('Squadra non valida.');const m=p[this.missionSlot({squad})];if(!m||m.phase==='returning')throw Error('Nessuna spedizione richiamabile.');for(const id of m.reservations||[])this.addItem(p,id,1);m.reservations=[];m.phase='returning';m.returnAt=now+Math.min(m.travel,Math.max(1000,now-m.departAt));m.result={title:'Spedizione richiamata',text:'Cibo consumato; strumenti non utilizzati restituiti.',resources:{},xp:0,prestige:0,success:false};this.report(p,m,m.result,now);return}
  const alliance=p.alliance;
  const result=super.command(p,cmd,now);
  if (cmd?.type==='alliance' && cmd.action==='leave' && alliance && !this.alliances[alliance]) delete this.allianceDevelopment.records[alliance];
  return result;
 }
 complete(p,m,now){const max=this.teamLimit(p),before=new Set(p.creatures.map(c=>c.id));super.complete(p,m,now);for(const c of p.creatures)if(!before.has(c.id))c.workTalent=m.result?.captured?.workTalent||null;p.team=p.team.slice(0,max)}
 healAtBase(p,elapsed){
  const away = new Set(this.activeMissions(p).flatMap(m=>m.roster.map(c=>c.id)));
  const recovery = elapsed*(1+3*(p.buildings.infirmary||0)*facilityState(p,'infirmary').coverage*(1+facilityBonus(p,'infirmary','healing')))/60*this.speedFactor;
  for (const c of p.creatures) if (!away.has(c.id)) c.hp = Math.min(stats(c).hp,c.hp+recovery);
 }
 accrueUntil(now){for(const p of Object.values(this.players)){const elapsed=Math.max(0,(now-p.updated)/1000);if(elapsed){this.accrue(p,Math.min(elapsed,86400));this.healAtBase(p,elapsed);p.updated=now}}}

 nextEventAt(){const dates=[super.nextEventAt(),...Object.values(this.players).map(p=>p.craftJob?.end),...this.playerMarket.deadlines()].filter(x=>x!=null);return dates.length?Math.min(...dates):null}
 snapshot(p){const s=super.snapshot(p);s.market=this.playerMarket.view(p);s.allianceDevelopment=this.allianceDevelopment.view(p);this.terrainAvailability(s.world.tiles);s.me.betaMission=p.betaMission??null;s.me.betaLock=this.betaLock(p);s.me.betaCandidates=this.betaCandidates(p).filter(c=>!this.inExpedition(p,c.id)).map(c=>c.id);s.me.capturePlaces=this.capturePlaces(p);s.me.gatherUnitLoad=this.gatherUnitLoad(p);const nominalRates=this.rates(p),effectiveRates=Object.fromEntries(Object.entries(nominalRates).map(([r,v])=>[r,p.resources[r]>=this.cap(p)?0:v]));s.me.workforce=Object.fromEntries(Object.keys(ROLES).map(id=>[id,{...facilityState(p,id),automationCost:this.automationCost(p,id),moduleInstalled:!!p.automationModules?.[id]}]));s.me.talentMisses=p.talentMisses;s.me.creatures=s.me.creatures.map(c=>({...c,talent:describeTalent(c)}));s.me.recipeCosts=Object.fromEntries(RECIPES.map(r=>[r.id,laborCost(p,r.structure,r.cost)]));s.profile={name:this.profile||'live',speed:this.speedFactor};for(const t of s.world.tiles)if(t.resource==='energy')t.resource='reagents';s.me={...s.me,rates:effectiveRates,nominalRates,teamLimit:this.teamLimit(p),power:energyState(p),hourlyRates:hourlyRates(p),buildCosts:Object.fromEntries(BUILDINGS.map(b=>[b.id,this.buildCost(p,b.id)])),researchCosts:Object.fromEntries(RESEARCH.map(r=>[r.id,this.researchCost(p,r.id)])),buildDurations:Object.fromEntries(BUILDINGS.map(b=>[b.id,this.duration('building',p,b.id)])),researchDurations:Object.fromEntries(RESEARCH.map(r=>[r.id,this.duration('research',p,r.id)])),locks:{buildings:Object.fromEntries(BUILDINGS.map(b=>[b.id,this.buildingLock(p,b.id)])),research:Object.fromEntries(RESEARCH.map(r=>[r.id,this.researchLock(p,r.id)])),recipes:Object.fromEntries(RECIPES.map(r=>[r.id,this.recipeLock(p,r.id)])),missions:Object.fromEntries(Object.keys(MISSIONS).map(id=>[id,this.missionLock(p,id)]))},recipeDurations:Object.fromEntries(RECIPES.map(r=>[r.id,this.itemDuration(p,r,1)])),speciesLocks:Object.fromEntries(SPECIES.map(c=>[c.id,this.captureLock(p,c.id)])),missionRange:3+2*(p.buildings.observatory||0)+(p.research.logistics||0),missionDifficulty:1+Math.floor(p.buildings.hq/2)+(p.research.cartography||0)};return s}
}
