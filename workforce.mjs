import {KANTO} from './kanto.mjs';

export const WORKFORCE_VERSION=1;
export const RARITIES=[{id:'common',name:'Comune',chance:70},{id:'uncommon',name:'Non comune',chance:25},{id:'rare',name:'Rara',chance:5}];
// Effects are local to the listed facilities or to the frozen expedition roster.
const talent=(name,effect,value,facilities=[],missions=[])=>({name,effect,value,facilities,missions});
export const TALENTS={
 normale:[talent('Versatilità','speed',.08,['hq','lab','infirmary']),talent('Ordine','materialsCost',.06,['hq','lab']),talent('Coordinamento','yield',.12,['warehouse'])],
 fuoco:[talent('Fornace','speed',.10,['workshop']),talent('Recupero termico','energy',.08,['refinery']),talent('Fusione precisa','materialsCost',.10,['workshop'])],
 acqua:[talent('Irrigazione','yield',.10,['farm']),talent('Lavaggio','yield',.08,['refinery']),talent('Ciclo chiuso','energy',.12,['farm','refinery'])],
 erba:[talent('Coltivazione','yield',.10,['farm']),talent('Nutrimento','foodCost',.08,['habitat']),talent('Botanica avanzata','foodCost',.12,['infirmary'])],
 elettro:[talent('Generazione','yield',.10,['generator']),talent('Stabilizzazione','energy',.08,['quarry','farm','refinery']),talent('Rete efficiente','yield',.12,['generator'])],
 ghiaccio:[talent('Refrigerazione','yield',.10,['warehouse']),talent('Catena del freddo','energy',.08,['refinery']),talent('Crioconservazione','reagentsCost',.12,['lab'])],
 lotta:[talent('Movimentazione','gather',.10,[],['gather']),talent('Montaggio','speed',.08,['workshop']),talent('Cantiere coordinato','speed',.12,['hq'])],
 veleno:[talent('Separazione','yield',.10,['refinery']),talent('Decontaminazione','reagentsCost',.08,['lab','workshop']),talent('Recupero chimico','reagentsCost',.12,['workshop'])],
 terra:[talent('Scavo','yield',.10,['quarry']),talent('Prospezione','gather',.08,[],['gather']),talent('Carico minerario','gather',.12,[],['gather'])],
 volante:[talent('Ricognitore','travel',.08,[],['survey']),talent('Orientamento','foodCost',.08,[],['survey','study','capture','gather','battle']),talent('Cartografo esperto','studyReward',.12,[],['study'])],
 psico:[talent('Analisi','speed',.10,['lab']),talent('Metodo','reagentsCost',.08,['lab']),talent('Intuizione','studyReward',.12,[],['study'])],
 coleottero:[talent('Impollinazione','yield',.08,['farm']),talent('Monitoraggio','work',.10,[],['study']),talent('Simbiosi','speed',.12,['habitat'])],
 roccia:[talent('Frantumazione','yield',.10,['quarry']),talent('Fondamenta','materialsCost',.08,['hq']),talent('Recupero minerario','gather',.12,[],['gather'])],
 spettro:[talent('Indagine','work',.10,[],['study']),talent('Discrezione','foodCost',.08,[],['study']),talent('Memoria del luogo','studyReward',.12,[],['study'])],
 drago:[talent('Resistenza','travel',.10,[],['survey','study','capture','gather']),talent('Vigilanza','foodCost',.08,[],['study','survey']),talent('Presenza antica','studyReward',.12,[],['study'])],
 acciaio:[talent('Assemblaggio','speed',.10,['workshop']),talent('Precisione','materialsCost',.08,['workshop']),talent('Standardizzazione','batchSpeed',.12,['workshop'])],
 folletto:[talent('Assistenza','healing',.10,['infirmary']),talent('Cura attenta','foodCost',.08,['infirmary']),talent('Equilibrio','work',.12,[],['study'])]
};
export const ROLES={
 hq:['normale','lotta','roccia'],quarry:['terra','roccia','elettro'],farm:['erba','acqua','coleottero','elettro'],generator:['elettro'],
 refinery:['veleno','acqua','elettro','fuoco','ghiaccio'],habitat:['erba','coleottero','folletto'],lab:['psico','normale','veleno','ghiaccio'],
 observatory:['volante','psico'],warehouse:['normale','ghiaccio','acqua'],workshop:['fuoco','acciaio','lotta','veleno'],infirmary:['normale','folletto','erba'],depot:['lotta','terra']
};
export const EFFECT_LABELS={yield:'resa',speed:'velocità',materialsCost:'risparmio materiali',foodCost:'risparmio cibo',reagentsCost:'risparmio reagenti',energy:'risparmio energetico',healing:'recupero PS',gather:'carico raccolto',travel:'velocità viaggio',work:'velocità sul campo',studyReward:'ricompense degli studi',batchSpeed:'velocità lotti da 5+'};
const species=id=>KANTO.find(s=>s.id===id);
export function validTalent(c){const t=c.workTalent;return !!t&&species(c.species)?.types.includes(t.type)&&Number.isInteger(t.rank)&&!!TALENTS[t.type]?.[t.rank]}
export function describeTalent(c){return validTalent(c)?{...TALENTS[c.workTalent.type][c.workTalent.rank],...c.workTalent,rarity:RARITIES[c.workTalent.rank].name}:null}
export function rollTalent(type,random,misses=0){if(!TALENTS[type])throw Error('Tipo lavorativo non valido.');const n=random();return{type,rank:misses>=39?2:n<.7?0:n<.95?1:2}}
export function compatible(c,id){return !!ROLES[id]&&species(c.species)?.types.some(t=>ROLES[id].includes(t))}
export function workSlots(p,id){return (p.buildings?.[id]||0)>0?Math.min(3,1+Math.floor((p.buildings[id]-1)/5)):0}
export function workers(p,id){return (p.creatures||[]).filter(c=>c.assignment===id&&compatible(c,id)&&!p.team?.includes(c.id)&&!p.mission?.roster?.some(r=>r.id===c.id)&&c.hp>0).slice(0,workSlots(p,id))}
function stack(list,effect,accept){return Math.min(['materialsCost','foodCost','reagentsCost','energy'].includes(effect)?.2:.25,list.map(describeTalent).filter(t=>t&&t.effect===effect&&accept(t)).map(t=>t.value).sort((a,b)=>b-a).slice(0,3).reduce((n,v,i)=>n+v*[1,.5,.25][i],0))}
export function facilityBonus(p,id,effect,quantity=1){if(effect==='batchSpeed'&&quantity<5)return 0;return stack(workers(p,id),effect,t=>t.facilities.includes(id))}
export function expeditionBonus(roster,kind,effect){return stack(roster||[],effect,t=>t.missions.includes(kind))}
export function facilityState(p,id){
 const slots=workSlots(p,id),staff=workers(p,id),mode=p.workModes?.[id]||'service';
 // Solar panels work unattended. People improve output; they are never fuel.
 const coverage=id==='generator'?1:slots?Math.max(mode==='auto'?.85:.70,.70+.30*Math.min(1,staff.reduce((n,c)=>n+Math.min(1.1,1+(c.level-1)*.005),0)/slots)):0;
 return{slots,workers:staff.map(c=>c.id),types:ROLES[id],mode,coverage,automated:mode==='auto'&&staff.length<slots,bonus:Object.fromEntries(Object.keys(EFFECT_LABELS).map(e=>[e,facilityBonus(p,id,e,e==='batchSpeed'?5:1)]))};
}
export function facilitySpeed(p,id,quantity=1){const s=facilityState(p,id);return Math.max(.1,s.coverage)*(1+Math.min(.25,s.bonus.speed+facilityBonus(p,id,'batchSpeed',quantity)))}
export function laborCost(p,id,cost){return Object.fromEntries(Object.entries(cost).map(([r,n])=>[r,Math.ceil(n*(1-facilityBonus(p,id,r+'Cost')))]))}
export function normalizeWorkforce(p){
 p.workModes??={};p.talentMisses??={};p.workforceVersion=WORKFORCE_VERSION;
 for(const c of p.creatures||[]){if(!validTalent(c))c.workTalent=null;if(c.assignment&&(!ROLES[c.assignment]||!compatible(c,c.assignment)||!p.buildings[c.assignment]||p.team.includes(c.id)||p.mission?.roster?.some(r=>r.id===c.id)))c.assignment=null;}
 for(const id of Object.keys(ROLES)){const list=(p.creatures||[]).filter(c=>c.assignment===id);for(const c of list.slice(workSlots(p,id)))c.assignment=null;if(!['auto','service'].includes(p.workModes[id]))p.workModes[id]='service';}
}
