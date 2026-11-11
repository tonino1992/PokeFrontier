import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {CampaignGame} from '../campaign.mjs';
import {stats} from '../game.mjs';

const destination = {x:-5,y:6};
const setup = () => {
 const game = new CampaignGame(null,{random:()=>0});
 const {p} = game.create('Ricercatore','bulbasaur');
 const member = {id:randomUUID(),species:'caterpie',level:1,xp:0,hp:100};
 member.hp = stats(member).hp;
 p.creatures.push(member);
 return {game,p,member,now:p.updated};
};
const unlock = p => {
 Object.assign(p.buildings,{hq:3,habitat:2,lab:1});
 Object.assign(p.research,{logistics:1,ecology:1});
};

test('Beta richiede lo sblocco e rifiuta membri dell’Alfa, lavoratori e duplicati',()=>{
 const {game,p,member,now}=setup();
 const beta={type:'dispatch',squad:'beta',kind:'survey',roster:[member.id],...destination};
 const food=p.resources.food;
 assert.throws(()=>game.command(p,beta,now),/Prerequisiti/);
 unlock(p);
 assert.throws(()=>game.command(p,{...beta,roster:[p.team[0]]},now),/riserva/);
 assert.throws(()=>game.command(p,{...beta,roster:[member.id,member.id]},now),/distinti/);
 game.command(p,{type:'assign',creatureId:member.id,structure:'farm'},now);
 assert.throws(()=>game.command(p,beta,now),/riserva/);
 assert.equal(p.resources.food,food);
});

test('due spedizioni simultanee consegnano dopo il riavvio e danno XP ai rispettivi membri',()=>{
 const {game,p,member,now}=setup();unlock(p);
 game.command(p,{type:'dispatch',kind:'capture',species:'caterpie',...destination},now);
 game.command(p,{type:'dispatch',kind:'capture',squad:'beta',roster:[member.id],species:'caterpie',...destination},now);
 assert.equal(game.snapshot(p).me.betaMission.squad,'beta');
 assert.throws(()=>game.command(p,{type:'assign',creatureId:member.id,structure:'farm'},now),/spedizione/);
 const end=Math.max(p.mission.returnAt,p.betaMission.returnAt);
 const restored=new CampaignGame(JSON.parse(JSON.stringify(game.serialize())),{random:()=>0});
 restored.tick(end);
 const saved=restored.players[p.id];
 assert.equal(saved.mission,null);
 assert.equal(saved.betaMission,null);
 assert.equal(saved.creatures.length,4);
 assert.equal(saved.creatures.find(c=>c.id===member.id).xp,20);
 assert.equal(saved.creatures[0].xp,20);
 assert.equal(saved.team.length,2);
 assert.equal(saved.reports.filter(r=>r.returned&&r.squad==='beta').length,1);
 restored.tick(end+1000);
 assert.equal(saved.creatures.length,4);
});

test('l’ultimo posto dell’Habitat è riservato e il richiamo Beta lascia l’Alfa in missione',()=>{
 const {game,p,member,now}=setup();unlock(p);
 while(p.creatures.length<game.capacity(p)-1)p.creatures.push({...member,id:randomUUID()});
 const capture={type:'dispatch',kind:'capture',species:'caterpie',...destination};
 const balls=p.balls;
 game.command(p,{...capture,squad:'beta',roster:[member.id]},now);
 assert.equal(game.snapshot(p).me.capturePlaces,0);
 assert.throws(()=>game.command(p,capture,now),/posto libero/);
 assert.throws(()=>game.command(p,{type:'team',ids:[member.id]},now),/Squadra Beta/);
 game.command(p,{type:'dispatch',kind:'survey',...destination},now);
 const alpha=p.mission.id;
 game.command(p,{type:'recall',squad:'beta'},now+1000);
 assert.equal(p.balls,balls);
 assert.equal(p.mission.id,alpha);
 assert.equal(p.betaMission.phase,'returning');
 assert.equal(game.snapshot(p).me.capturePlaces,1);
});
