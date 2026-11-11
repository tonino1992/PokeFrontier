import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignGame} from '../campaign.mjs';
import {TECH_NODES,progression,technologyDetail} from '../technology.mjs';
import {energyState} from '../balance.mjs';
function setup(){const g=new CampaignGame(),{p}=g.create('Tecnologo','bulbasaur');return{g,p}}
test('grafo di 400 livelli: archi validi e nessun ciclo, inclusi livelli precedenti e limite del laboratorio',()=>{
 assert.equal(Object.keys(TECH_NODES).length,400);const done=new Set(),active=new Set();function visit(key){if(done.has(key))return;assert.ok(!active.has(key),'Ciclo '+key);const node=TECH_NODES[key];assert.ok(node,'Nodo mancante '+key);active.add(key);for(const e of node.edges)visit(`${e.kind}:${e.id}:${e.level}`);active.delete(key);done.add(key)}for(const key of Object.keys(TECH_NODES))visit(key);
 assert.ok(TECH_NODES['research:ecology:9'].edges.some(e=>e.id==='lab'&&e.level===5));assert.ok(TECH_NODES['building:habitat:2'].edges.some(e=>e.kind==='research'&&e.id==='ecology'&&e.level===1));assert.equal(TECH_NODES['research:energy:1'].power,60);
});
test('confronti derivati dal motore senza cambiare risorse, incarichi o livelli',()=>{
 const{g,p}=setup(),before=JSON.stringify(p),result=progression(g,p);assert.equal(Object.keys(result).length,20);assert.equal(result['building:quarry'].current[0].value,g.rates(p).materials*3600);const clone=structuredClone(p);clone.buildings.quarry++;assert.equal(result['building:quarry'].next[0].value,g.rates(clone).materials*3600);assert.equal(result['building:generator'].current[0].value,energyState(p).produced);assert.equal(JSON.stringify(p),before);
});
test('livelli e sblocchi mostrano squadra, capienza, ricette e ricerche indirette reali',()=>{
 const{g,p}=setup();const habitat=technologyDetail(g,p,'building','habitat');assert.equal(habitat.levels.length,21);assert.equal(habitat.levels[2].metrics.find(m=>m.label==='Membri della squadra').value,2);assert.equal(habitat.levels[4].metrics.find(m=>m.label==='Membri della squadra').value,3);
 const workshop=technologyDetail(g,p,'building','workshop');assert.ok(workshop.unlocks.some(u=>u.id==='greatBall'&&u.atLevel===3));assert.ok(workshop.unlocks.some(u=>u.id==='ultraBall'&&u.atLevel===6));assert.ok(technologyDetail(g,p,'building','hq').unlocks.some(u=>u.name==='Moduli di automazione'&&u.atLevel===2));
 assert.equal(technologyDetail(g,p,'research','capture').levels[3].metrics[0].value,9);assert.throws(()=>technologyDetail(g,p,'invalid','hq'));assert.throws(()=>technologyDetail(g,p,'building','invalid'));
});
