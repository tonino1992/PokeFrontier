import {BUILDINGS,RESEARCH,RECIPES,MISSION_REQUIREMENTS,BETA_REQUIREMENTS,buildingRequirements,energyState} from './balance.mjs';
import {facilityState,facilityBonus,workSlots} from './workforce.mjs';
import {MISSIONS} from './strategic.mjs';

export const techKey=(kind,id,level)=>`${kind}:${id}:${level}`;
export function requirements(kind,id,level){
 const req=structuredClone(kind==='building'?buildingRequirements(id,level):RESEARCH.find(r=>r.id===id).requirements||{});
 if(kind==='research'){req.buildings??={};req.buildings.lab=Math.max(req.buildings.lab||0,Math.ceil(level/2));}
 const edges=[];for(const [group,values] of Object.entries(req))for(const [source,n] of Object.entries(values))if(n>0)edges.push({kind:group==='buildings'?'building':'research',id:source,level:n});
 if(level>1)edges.push({kind,id,level:level-1});
 return{edges,power:kind==='research'?(RESEARCH.find(r=>r.id===id).power||0):0};
}
export const TECH_NODES=Object.fromEntries(['building','research'].flatMap(kind=>(kind==='building'?BUILDINGS:RESEARCH).flatMap(d=>Array.from({length:20},(_,i)=>{const level=i+1;return[techKey(kind,d.id,level),{kind,id:d.id,name:d.name,level,...requirements(kind,d.id,level)}]}))));
function metrics(game,p,kind,id){
 const l=p[kind==='building'?'buildings':'research'][id]||0,rate=r=>game.rates(p)[r]*3600,coverage=id=>facilityState(p,id).coverage;
 const row=(label,value,unit='',direction='up')=>({label,value,unit,direction});let rows=[];
 if(kind==='building'){
  switch(id){
   case'hq':rows=[row('Tempo base delle costruzioni',100/(1+.12*l),'%','down'),row('Difficoltà raggiungibile',1+Math.floor(l/2)+(p.research.cartography||0))];break;
   case'quarry':rows=[row('Materiali prodotti',rate('materials'),'/h')];break;
   case'farm':rows=[row('Cibo prodotto',rate('food'),'/h')];break;
   case'generator':rows=[row('Potenza prodotta',energyState(p).produced),row('Bilancio energetico',energyState(p).balance)];break;
   case'refinery':rows=[row('Reagenti prodotti',rate('reagents'),'/h')];break;
   case'habitat':rows=[row('Capacità Pokémon',game.capacity(p)),row('Membri della squadra',game.teamLimit(p))];break;
   case'lab':rows=[row('Livello massimo per tecnologia',Math.min(20,l*2)),row('Tempo base delle ricerche',100/(1+.12*l),'%','down')];break;
   case'observatory':rows=[row('Raggio delle missioni',3+2*l+(p.research.logistics||0),'caselle'),row('Velocità di viaggio',game.speed(p)*60,'caselle/min')];break;
   case'warehouse':rows=[row('Capienza per risorsa',game.cap(p))];break;
   case'workshop':rows=[row('Fabbricazione di una Poké Ball',l?game.itemDuration(p,RECIPES.find(r=>r.id==='ball'),1)/1000:null,'secondi','down')];break;
   case'infirmary':rows=[row('Recupero alla base',(1+3*l*coverage(id)*(1+facilityBonus(p,id,'healing')))*game.speedFactor,'PS/min')];break;
   case'depot':rows=[row('Bonus al carico da deposito',8*l*coverage(id),'%')];break;
  }
  rows.push(row('Posti lavoratori',workSlots(p,id)),row('Operatività',coverage(id)*100,'%'));
 }else{
  switch(id){
   case'energy':rows=[row('Bonus alla generazione',5*l,'%'),row('Potenza prodotta',energyState(p).produced)];break;
   case'ecology':rows=[row('Bonus agricolo',3*l,'%'),row('Cibo prodotto',rate('food'),'/h')];break;
   case'gather':rows=[row('Bonus al carico della raccolta',10*l,'%')];break;
   case'cartography':rows=[row('Difficoltà raggiungibile',1+Math.floor(p.buildings.hq/2)+l)];break;
   case'capture':rows=[row('Bonus alla probabilità di cattura',3*l,'punti %')];break;
   case'attack':rows=[row('Bonus offensivo della squadra',6*l,'%')];break;
   case'logistics':rows=[row('Bonus alla velocità di viaggio',8*l,'%'),row('Raggio delle missioni',3+2*(p.buildings.observatory||0)+l,'caselle'),row('Velocità di viaggio',game.speed(p)*60,'caselle/min')];break;
   case'analysis':rows=[row('Bonus ai reagenti',5*l,'%'),row('Reagenti prodotti',rate('reagents'),'/h')];break;
  }
 }
 if(['quarry','farm','refinery'].includes(id)&&kind==='building')rows.push(row('Domanda dell’impianto',energyState(p).byPlant[id]||0,'potenza','down'),row('Efficienza della rete',energyState(p).factor*100,'%'));
 return rows;
}
export function levelPreview(game,p,kind,id,level){
 const defs=kind==='building'?BUILDINGS:kind==='research'?RESEARCH:null;if(!defs?.some(d=>d.id===id)||!Number.isInteger(level)||level<0||level>20)throw Error('Tecnologia o livello non valido.');
 const copy=structuredClone(p);copy[kind==='building'?'buildings':'research'][id]=level;
 return metrics(game,copy,kind,id);
}
export function progression(game,p){return Object.fromEntries(['building','research'].flatMap(kind=>(kind==='building'?BUILDINGS:RESEARCH).map(d=>{const level=p[kind==='building'?'buildings':'research'][d.id]||0;return[`${kind}:${d.id}`,{kind,id:d.id,level,current:levelPreview(game,p,kind,d.id,level),next:level<20?levelPreview(game,p,kind,d.id,level+1):null}]})))}
export function unlocks(p,kind,id){
 const group=kind==='building'?'buildings':'research',list=[];
 // First unlocks are separated from higher-level requirements to avoid calling
 // a contribution to one prerequisite an immediately available feature.
 for(const node of Object.values(TECH_NODES))if(node.edges.some(e=>e.kind===kind&&e.id===id&&!(e.kind===node.kind&&e.id===node.id))){const edge=node.edges.find(e=>e.kind===kind&&e.id===id);list.push({name:node.name,kind:node.kind,id:node.id,targetLevel:node.level,atLevel:edge.level})}
 for(const r of RECIPES)if(r.requirements[group]?.[id])list.push({name:r.name,kind:'recipe',id:r.id,atLevel:r.requirements[group][id]});
 for(const [mid,req]of Object.entries(MISSION_REQUIREMENTS))if(req[group]?.[id])list.push({name:MISSIONS[mid].name,kind:'mission',id:mid,atLevel:req[group][id]});
 if(BETA_REQUIREMENTS[group]?.[id])list.push({name:'Squadra Beta',kind:'feature',atLevel:BETA_REQUIREMENTS[group][id]});
 if(kind==='building'&&id==='hq')list.push({name:'Moduli di automazione',kind:'feature',atLevel:2});
 const tiers=[{tier:2,buildings:{hq:4},research:{capture:2,ecology:2}},{tier:3,buildings:{hq:6},research:{capture:3,ecology:4}},{tier:4,buildings:{hq:9,lab:6},research:{capture:6,ecology:6}}];
 for(const t of tiers)if(t[group][id])list.push({name:t.tier===4?'Catture leggendarie':`Catture di fascia ${t.tier}`,kind:'feature',atLevel:t[group][id]});
 return list.sort((a,b)=>a.atLevel-b.atLevel||(a.targetLevel||0)-(b.targetLevel||0));
}
export function technologyDetail(game,p,kind,id){
 const summary=progression(game,p)[`${kind}:${id}`];if(!summary)throw Error('Tecnologia non valida.');
 return{...summary,levels:Array.from({length:21},(_,l)=>{const copy=structuredClone(p);copy[kind==='building'?'buildings':'research'][id]=Math.max(0,l-1);return{level:l,metrics:levelPreview(game,p,kind,id,l),cost:l?(kind==='building'?game.buildCost(copy,id):game.researchCost(copy,id)):{},duration:l?game.duration(kind,copy,id):0};}),unlocks:unlocks(p,kind,id)};
}
