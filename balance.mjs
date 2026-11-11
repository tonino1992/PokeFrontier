import {facilityState,facilityBonus} from './workforce.mjs';
import {FIELD_MATERIALS} from './habitat.mjs';
export const BALANCE_VERSION=2;
export const BUILDINGS=[
 {id:'hq',name:'Centro operativo',icon:'⌂',desc:'Coordina la progressione e sblocca nuovi rami.',base:{materials:220,food:100,reagents:20},factor:1.65,seconds:180},
 {id:'quarry',name:'Cava',icon:'⛏',desc:'Estrae materiali; richiede capacità energetica.',base:{materials:60,food:25},factor:1.55,seconds:75},
 {id:'farm',name:'Coltivazioni',icon:'❧',desc:'Producono cibo per spedizioni e cure.',base:{materials:45,food:15},factor:1.55,seconds:70},
 {id:'generator',name:'Centrale solare',icon:'ϟ',desc:'Fornisce potenza continua. L’energia non si accumula.',base:{materials:75,reagents:12},factor:1.6,seconds:90},
 {id:'refinery',name:'Estrattore reagenti',icon:'◆',desc:'Produce reagenti per ricerca e fabbricazione.',base:{materials:180,food:70},factor:1.65,seconds:180},
 {id:'habitat',name:'Habitat',icon:'♧',desc:'Ospita Pokémon. Ai livelli 2 e 4 sblocca il secondo e terzo membro.',base:{materials:140,food:100},factor:1.7,seconds:150},
 {id:'lab',name:'Laboratorio',icon:'⚗',desc:'Sblocca tecnologie e abilita i rami scientifici.',base:{materials:240,reagents:70,credits:20},factor:1.8,seconds:240},
 {id:'observatory',name:'Osservatorio',icon:'⌖',desc:'Estende il raggio delle missioni e abilita scanner.',base:{materials:200,reagents:50},factor:1.7,seconds:210},
 {id:'warehouse',name:'Magazzino',icon:'▣',desc:'Aumenta la capacità di materiali, cibo e reagenti.',base:{materials:160,food:50},factor:1.65,seconds:150},
 {id:'workshop',name:'Officina',icon:'⚒',desc:'Fabbrica Ball ed equipaggiamento. I livelli accelerano le ricette.',base:{materials:280,reagents:100},factor:1.8,seconds:240},
 {id:'infirmary',name:'Infermeria',icon:'✚',desc:'Accelera il recupero e permette di preparare pozioni.',base:{materials:220,food:150,reagents:70},factor:1.7,seconds:240},
 {id:'depot',name:'Deposito logistico',icon:'⇢',desc:'Aumenta il carico e sblocca moduli da trasporto.',base:{materials:320,food:120,reagents:100},factor:1.75,seconds:300}
];
export const RESEARCH=[
 {id:'energy',name:'Energetica',desc:'+5% potenza della centrale per livello.',base:{materials:80,reagents:50},factor:1.9,seconds:180,requirements:{buildings:{lab:1,generator:2}},power:60},
 {id:'ecology',name:'Ecologia applicata',desc:'Sblocca studi e specie più complesse. +3% produzione alimentare per livello.',base:{reagents:45,food:60},factor:1.85,seconds:180,requirements:{buildings:{lab:1,habitat:1}}},
 {id:'gather',name:'Estrazione efficiente',desc:'+10% carico raccolto per livello.',base:{materials:100,reagents:45},factor:1.85,seconds:210,requirements:{buildings:{lab:1,quarry:3}}},
 {id:'cartography',name:'Cartografia',desc:'Aumenta la difficoltà delle zone raggiungibili e abilita scanner.',base:{materials:80,reagents:60},factor:1.85,seconds:180,requirements:{buildings:{lab:1,observatory:1}}},
 {id:'capture',name:'Tecniche di cattura',desc:'+3 punti percentuali alla cattura e accesso a Ball avanzate.',base:{materials:100,reagents:90,credits:30},factor:1.9,seconds:300,requirements:{buildings:{lab:2,workshop:1},research:{ecology:1}}},
 {id:'attack',name:'Tattiche di contenimento',desc:'+6% efficacia offensiva della squadra per livello.',base:{materials:150,reagents:80},factor:1.9,seconds:300,requirements:{buildings:{lab:2,habitat:2},research:{ecology:1}}},
 {id:'logistics',name:'Logistica',desc:'+8% velocità di viaggio per livello. Abilita moduli di carico.',base:{materials:200,reagents:120},factor:1.95,seconds:360,requirements:{buildings:{lab:3,observatory:2},research:{cartography:2}}},
 {id:'analysis',name:'Analisi dei reagenti',desc:'+5% produzione di reagenti per livello.',base:{materials:180,reagents:180},factor:1.95,seconds:420,requirements:{buildings:{lab:3,refinery:2},research:{ecology:2}},power:140}
];
export const RECIPES=[
 {id:'ball',name:'Poké Ball',desc:'Strumento base per una missione di cattura.',structure:'workshop',requirements:{buildings:{workshop:1}},cost:{materials:12,reagents:6,credits:2},seconds:45},
 {id:'greatBall',name:'Mega Ball',desc:'+8 punti percentuali di cattura rispetto alla Ball base.',structure:'workshop',requirements:{buildings:{workshop:3},research:{capture:3}},cost:{materials:30,reagents:22,credits:6},seconds:120},
 {id:'ultraBall',name:'Ultra Ball',desc:'+15 punti percentuali di cattura.',structure:'workshop',requirements:{buildings:{workshop:6},research:{capture:6}},cost:{materials:65,reagents:50,credits:15},seconds:240},
 {id:'potion',name:'Pozione',desc:'Ripristina fino a 55 PS a ciascun membro alla base.',structure:'infirmary',requirements:{buildings:{infirmary:1},research:{ecology:1}},cost:{food:35,reagents:5},seconds:60},
 {id:'bait',name:'Esca di ricerca',desc:'Consumabile: +5 punti percentuali in una cattura.',mission:'capture',captureBonus:.05,structure:'habitat',requirements:{buildings:{habitat:2},research:{ecology:2}},cost:{food:30,reagents:12},seconds:90},
 {id:'scanner',name:'Scanner da campo',desc:'Consumabile: una ricognizione rivela anche le caselle adiacenti.',mission:'survey',structure:'observatory',requirements:{buildings:{observatory:2},research:{cartography:2}},cost:{materials:35,reagents:25},seconds:120},
 {id:'cargo',name:'Modulo di carico',desc:'Consumabile: +50% carico in una raccolta.',mission:'gather',loadFactor:1.5,structure:'depot',requirements:{buildings:{depot:2,workshop:2},research:{logistics:2}},cost:{materials:8,reagents:3},seconds:150},
 {id:'fieldBait',name:'Esca concentrata',desc:'Consumabile: +10 punti percentuali in una cattura. Richiede fibra dai siti specializzati.',mission:'capture',captureBonus:.10,structure:'habitat',requirements:{buildings:{habitat:2},research:{ecology:2}},cost:{food:30,reagents:12,fiber:1},seconds:120},
 {id:'fieldCargo',name:'Modulo rinforzato',desc:'Consumabile: raddoppia il carico di risorse ordinarie. Richiede cristalli dai siti specializzati.',mission:'gather',loadFactor:2,structure:'depot',requirements:{buildings:{depot:2,workshop:2},research:{logistics:2}},cost:{materials:8,reagents:3,crystal:2},seconds:180},
 {id:'rover',name:'Rover da carico',desc:'Veicolo riutilizzabile. Consegna un lotto di massimo 20 strumenti a un altro avamposto e poi rientra.',structure:'depot',requirements:{buildings:{depot:1}},cost:{materials:150,reagents:40,credits:30},seconds:360}
];
export const MISSION_REQUIREMENTS={survey:{},study:{buildings:{lab:1,habitat:1},research:{ecology:1}},gather:{buildings:{hq:2,quarry:2}},capture:{buildings:{lab:1,habitat:1},research:{ecology:1}},battle:{buildings:{habitat:2},research:{attack:1}}};
export const BETA_REQUIREMENTS={buildings:{habitat:2},research:{logistics:1}};
export function buildingRequirements(id,next){
 const req={buildings:{},research:{}};
 const basic={refinery:{hq:2,quarry:2,generator:2},habitat:{hq:2,farm:2},lab:{hq:2,refinery:1},observatory:{hq:2,lab:1},warehouse:{hq:2,quarry:2},workshop:{hq:2,lab:1},infirmary:{hq:3,habitat:2},depot:{hq:4,warehouse:2,workshop:2}};
 Object.assign(req.buildings,basic[id]||{});
 if(id==='hq'){if(next>=2)Object.assign(req.buildings,{quarry:2,farm:2});if(next>=3)req.buildings.lab=1;if(next>=5)req.buildings.observatory=3;if(next>=8)req.research.logistics=3;}
 else if(['quarry','farm'].includes(id))req.buildings.hq=Math.max(req.buildings.hq||0,next-2);
 else if(id==='generator')req.buildings.hq=Math.max(0,next-3);
 else req.buildings.hq=Math.max(req.buildings.hq||0,next);
 if(id==='lab'&&next>=2)req.research.energy=1;
 if(id==='habitat'&&next>=2){req.research.ecology=next>=4?3:1;req.buildings.hq=Math.max(req.buildings.hq,Math.min(20,next+1));}
 if(id==='workshop'&&next>=2){req.buildings.hq=Math.max(req.buildings.hq,3);req.buildings.lab=2;req.research.capture=1;}
 if(['workshop','infirmary'].includes(id))req.research.ecology=1;
 if(id==='depot')req.research.logistics=1;
 return req;
}
export function scaledCost(base,factor,level){return Object.fromEntries(Object.entries(base).map(([r,n])=>[r,Math.ceil(n*factor**level)]))}
export function energyState(p){
 const pct=id=>(p.productionSettings?.[id]??100)/100,l=id=>p.buildings[id]||0;
 const output=Math.floor(30*l('generator')*1.1**Math.max(0,l('generator')-1)*(1+.05*(p.research.energy||0))*pct('generator')*(1+facilityBonus(p,'generator','yield')));
 const byPlant=Object.fromEntries([['quarry',10],['farm',8],['refinery',14]].map(([id,n])=>[id,n*l(id)*1.1**Math.max(0,l(id)-1)*pct(id)*(facilityState(p,id).automated?1.2:1)*(1-facilityBonus(p,id,'energy'))]));
 const demand=Math.ceil(Object.values(byPlant).reduce((a,b)=>a+b,0)),factor=demand===0?1:Math.min(1,output/demand);
 return{produced:output,consumed:Math.ceil(demand),balance:output-Math.ceil(demand),factor,byPlant};
}
export function hourlyRates(p){const e=energyState(p),l=id=>p.buildings[id]||0,pct=id=>(p.productionSettings?.[id]??100)/100;
 const amount=(id,n)=>n*l(id)*1.1**Math.max(0,l(id)-1)*pct(id)*e.factor*facilityState(p,id).coverage*(1+facilityBonus(p,id,'yield'));
 return{materials:20+amount('quarry',60),food:12+amount('farm',40)*(1+.03*(p.research.ecology||0)),reagents:4+amount('refinery',24)*(1+.05*(p.research.analysis||0))};}
export const RESOURCE_LABELS={materials:'Materiali',food:'Cibo',reagents:'Reagenti',credits:'Crediti',...Object.fromEntries(Object.entries(FIELD_MATERIALS).map(([id,m])=>[id,m.name]))};
