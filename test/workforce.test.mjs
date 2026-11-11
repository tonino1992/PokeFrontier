import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {CampaignGame} from '../campaign.mjs';
import {SPECIES,stats} from '../game.mjs';
import {BUILDINGS,RESEARCH,energyState} from '../balance.mjs';
import {TALENTS,ROLES,rollTalent,facilityState,facilityBonus,facilitySpeed,expeditionBonus} from '../workforce.mjs';
function setup(random=()=>0){const g=new CampaignGame(null,{random}),{p}=g.create('Ricercatore','bulbasaur');return{g,p,now:p.updated}}
function add(p,id,type,rank=0){const c={id:randomUUID(),species:id,level:1,xp:0,hp:50,workTalent:type?{type,rank}:null,assignment:null};c.hp=stats(c).hp;p.creatures.push(c);return c}
function develop(p){for(const b of BUILDINGS)p.buildings[b.id]=5;for(const r of RESEARCH)p.research[r.id]=5;p.resources={materials:1e6,food:1e6,reagents:1e6,credits:1e6}}
test('51 talenti per 17 tipi moderni, tre esiti e soglie 70/25/5 con garanzia',()=>{
 assert.equal(Object.keys(TALENTS).length,17);assert.equal(Object.values(TALENTS).flat().length,51);
 for(const [type,list] of Object.entries(TALENTS)){assert.ok(SPECIES.some(s=>s.types.includes(type)));assert.equal(list.length,3);for(const t of list){assert.ok(t.facilities.length||t.missions.length);assert.ok(t.facilities.every(id=>ROLES[id].includes(type)));}assert.equal(rollTalent(type,()=>.699).rank,0);assert.equal(rollTalent(type,()=>.7).rank,1);assert.equal(rollTalent(type,()=>.95).rank,2);assert.equal(rollTalent(type,()=>0,39).rank,2)}
});
test('assegnazioni per entrambi i tipi, esclusive rispetto a squadra e altre strutture',()=>{
 const{g,p,now}=setup();p.buildings.refinery=1;const c=p.creatures[0];g.command(p,{type:'assign',creatureId:c.id,structure:'farm'},now);assert.equal(p.team.length,0);assert.equal(c.assignment,'farm');assert.equal(facilityState(p,'farm').coverage,1);assert.throws(()=>g.command(p,{type:'team',ids:[c.id]},now),/Libera/);
 g.command(p,{type:'assign',creatureId:c.id,structure:'refinery'},now);assert.equal(facilityState(p,'farm').workers.length,0);assert.equal(c.assignment,'refinery');assert.throws(()=>g.command(p,{type:'assign',creatureId:c.id,structure:'quarry'},now),/incompatibile/);assert.equal(c.assignment,'refinery');
 g.command(p,{type:'assign',creatureId:c.id,structure:null},now);g.command(p,{type:'team',ids:[c.id]},now);assert.equal(p.team.length,1);assert.ok(Number.isFinite(g.snapshot(p).me.travelSpeed));
});
test('slot limitati, nessun comando su Pokémon altrui o in viaggio',()=>{
 const{g,p,now}=setup();const a=add(p,'oddish'),b=add(p,'bellsprout');g.command(p,{type:'assign',creatureId:a.id,structure:'farm'},now);assert.throws(()=>g.command(p,{type:'assign',creatureId:b.id,structure:'farm'},now),/occupati/);assert.equal(b.assignment,null);assert.throws(()=>g.command(p,{type:'assign',creatureId:'other',structure:'farm'},now),/posseduto/);
 g.command(p,{type:'dispatch',kind:'survey',x:-5,y:6},now);assert.throws(()=>g.command(p,{type:'assign',creatureId:p.team[0],structure:'farm'},now),/spedizione/);assert.throws(()=>g.command(p,{type:'chooseTalent',creatureId:p.team[0],talentType:'erba'},now),/rientro/);
});
test('il servizio permette di progredire senza lavoratori, automazione una sola installazione e domanda extra',()=>{
 const{g,p,now}=setup();assert.equal(facilityState(p,'farm').coverage,.7);p.buildings.hq=2;const before=energyState(p),stock=p.resources.materials,preview=g.previewWork(p,{type:'workMode',structure:'farm',mode:'auto'},now);assert.equal(p.resources.materials,stock);assert.equal(p.workModes.farm,'service');assert.ok(preview.after.hourly.food>preview.before.hourly.food);assert.ok(preview.after.power.consumed>preview.before.power.consumed);
 g.command(p,{type:'workMode',structure:'farm',mode:'auto'},now);assert.equal(p.resources.materials,stock-80);assert.equal(facilityState(p,'farm').coverage,.85);assert.ok(energyState(p).consumed>before.consumed);g.command(p,{type:'workMode',structure:'farm',mode:'service'},now);g.command(p,{type:'workMode',structure:'farm',mode:'auto'},now);assert.equal(p.resources.materials,stock-80);assert.equal(p.resources.energy,undefined);
});
test('migrazione e scelta iniziale non ripetibile conservano identità e progressi al riavvio',()=>{
 const{g,p,now}=setup(()=>.8),c=p.creatures[0],id=c.id;g.command(p,{type:'chooseTalent',creatureId:id,talentType:'veleno'},now);assert.deepEqual(c.workTalent,{type:'veleno',rank:1});assert.throws(()=>g.command(p,{type:'chooseTalent',creatureId:id,talentType:'erba'},now),/già assegnata/);
 const saved=JSON.parse(JSON.stringify(g.serialize())),restored=new CampaignGame(saved,{random:()=>.99}),q=restored.players[p.id];assert.deepEqual(q.creatures[0].workTalent,{type:'veleno',rank:1});assert.equal(q.creatures[0].id,id);
});
test('ogni cattura doppio tipo richiede la propria scelta prima di pagare',()=>{
 const{g,p,now}=setup();develop(p);g.tiles['-5:6'].encounters=['oddish'];const ball=p.balls,food=p.resources.food;
 assert.throws(()=>g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'oddish'},now),/Scegli il tipo/);assert.equal(p.balls,ball);assert.equal(p.resources.food,food);
 g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'oddish',talentType:'veleno'},now);let m=p.mission;g.tick(m.returnAt);assert.deepEqual(p.creatures.at(-1).workTalent,{type:'veleno',rank:0});
 assert.throws(()=>g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'oddish'},p.updated),/Scegli il tipo/);
 g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'oddish',talentType:'erba'},p.updated);m=p.mission;g.tick(m.returnAt);assert.deepEqual(p.creatures.at(-1).workTalent,{type:'erba',rank:0});
});
test('abilità estratta soltanto al successo, esito in rientro salvato senza nuovi tiri',()=>{
 let draws=0;const{g,p,now}=setup(()=>{draws++;return 0});develop(p);p.talentMisses.coleottero=39;g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'caterpie'},now);let m=p.mission;const start=draws;g.tick(m.completeAt);assert.equal(draws-start,2);assert.deepEqual(m.result.captured.workTalent,{type:'coleottero',rank:2});assert.equal(p.talentMisses.coleottero,0);
 const save=JSON.parse(JSON.stringify(g.serialize()));save.players[p.id].mission.returnAt=Date.now()-1;save.players[p.id].updated=Date.now()-2;const restored=new CampaignGame(save,{random:()=>{throw Error('Nuova estrazione non consentita')}});assert.deepEqual(restored.players[p.id].creatures.at(-1).workTalent,{type:'coleottero',rank:2});
});
test('fallimento e richiamo non generano talenti né aumentano la garanzia',()=>{
 const{g,p,now}=setup(()=>.999);develop(p);g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'caterpie'},now);g.tick(p.mission.returnAt);assert.equal(p.creatures.length,1);assert.equal(p.talentMisses.coleottero,undefined);
 g.command(p,{type:'dispatch',kind:'capture',x:-5,y:6,species:'caterpie'},p.updated);g.command(p,{type:'recall'},p.updated+1000);g.tick(p.mission.returnAt);assert.equal(p.creatures.length,1);assert.equal(p.talentMisses.coleottero,undefined);
});
test('cambio personale accelera solo il lavoro residuo e non ripaga costi passati',()=>{
 const{g,p,now}=setup();develop(p);const c=add(p,'abra','psico',0);g.command(p,{type:'research',id:'energy'},now);const oldEnd=p.researchJob.end,stock=p.resources.reagents,half=Math.floor((oldEnd+now)/2);g.command(p,{type:'assign',creatureId:c.id,structure:'lab'},half);assert.ok(p.researchJob.end<oldEnd);assert.ok(p.researchJob.end>half);assert.ok(p.resources.reagents>=stock);const firstEnd=p.researchJob.end;g.command(p,{type:'assign',creatureId:c.id,structure:null},half);assert.ok(Math.abs(p.researchJob.end-oldEnd)<=2);assert.ok(firstEnd>half);g.tick(p.researchJob.end);assert.equal(p.research.energy,6);
});
test('costi e bonus locali, copie attenuate e cap: nessun talento globale',()=>{
 const{g,p}=setup();develop(p);p.buildings.quarry=20;for(let i=0;i<3;i++)add(p,'geodude','roccia',0).assignment='quarry';assert.ok(Math.abs(facilityBonus(p,'quarry','yield')-.175)<1e-8);assert.equal(facilityBonus(p,'farm','yield'),0);
 const roster=[add(p,'pidgey','volante',1),add(p,'pidgey','volante',1),add(p,'pidgey','volante',1)];assert.ok(Math.abs(expeditionBonus(roster,'capture','foodCost')-.14)<1e-8);assert.equal(expeditionBonus(roster,'capture','yield'),0);
 const c=add(p,'magnemite','acciaio',1);c.assignment='workshop';const base=12;assert.equal(g.snapshot(p).me.recipeCosts.ball.materials,Math.ceil(base*.92));
});
test('bonus di missione congelati alla partenza, assegnazioni e talenti conservati offline',()=>{
 const{g,p,now}=setup();const c=p.creatures[0];g.command(p,{type:'chooseTalent',creatureId:c.id,talentType:'erba'},now);g.command(p,{type:'assign',creatureId:c.id,structure:'farm'},now);const rate=g.rates(p).food;const saved=JSON.parse(JSON.stringify(g.serialize()));const q=new CampaignGame(saved).players[p.id];assert.equal(q.creatures[0].assignment,'farm');assert.equal(q.team.length,0);assert.equal(facilityState(q,'farm').bonus.yield,.1);assert.ok(rate>12/3600);
});
test('velocità cumulata limitata al 25%, talento dei lotti attivo solo da cinque unità',()=>{
 const{p}=setup();develop(p);p.buildings.workshop=11;for(let i=0;i<2;i++)add(p,'magnemite','acciaio',2).assignment='workshop';add(p,'charmander','fuoco',0).assignment='workshop';
 assert.equal(facilitySpeed(p,'workshop',1),1.1);assert.equal(facilitySpeed(p,'workshop',5),1.25);
});
