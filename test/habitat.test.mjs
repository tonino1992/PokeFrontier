import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignGame} from '../campaign.mjs';

const coord = {x: -5, y: 6};
const key = '-5:6';
const view = (game, player) => game.snapshot(player).world.tiles.find(tile => tile.x === coord.x && tile.y === coord.y);

function setup() {
 const game = new CampaignGame(null, {random: () => 0});
 const {p: first} = game.create('Aurora', 'bulbasaur');
 const {p: second} = game.create('Boreale', 'bulbasaur');
 for (const player of [first, second]) {
  Object.assign(player.buildings, {hq: 2, quarry: 2, lab: 1, habitat: 1});
  player.research.ecology = 1;
  if (!player.discovered.includes(key)) player.discovered.push(key);
 }
 return {game, first, second, now: second.updated, tile: game.tiles[key]};
}

test('due giocatori contendono l’ultimo Pokémon e il server lo ripopola senza duplicarlo', () => {
 const {game, first, second, now, tile} = setup();
 tile.populations = {caterpie: {count: 1, nextAt: now + 30 * 60_000}};
 const command = {type: 'dispatch', kind: 'capture', species: 'caterpie', ...coord};
 const secondBalls = second.balls;
 game.command(first, command, now);
 game.command(second, command, now);
 game.tick(Math.max(first.mission.returnAt, second.mission.returnAt));
 assert.equal(first.creatures.length, 2);
 assert.equal(second.creatures.length, 1);
 assert.equal(second.balls, secondBalls);
 assert.equal(second.reports[0].title, 'Disponibilità esaurita');
 assert.equal(view(game, first).availability.populations.caterpie.count, 0);
 assert.equal(view(game, second).availability.populations.caterpie.count, 0);
 assert.throws(() => game.command(second, command, second.updated), /Popolazione esaurita/);
 game.tick(now + 30 * 60_000);
 assert.equal(view(game, second).availability.populations.caterpie.count, 1);
 second.discovered = second.discovered.filter(id => id !== key);
 assert.equal(view(game, second).availability, undefined);
});

test('la raccolta usa una riserva condivisa con recupero parziale e scadenze persistenti', () => {
 const {game, first, second, now, tile} = setup();
 tile.stock = 5;
 const command = {type: 'dispatch', kind: 'gather', ...coord};
 game.command(first, command, now);
 game.command(second, command, now);
 game.tick(Math.max(first.mission.returnAt, second.mission.returnAt));
 assert.equal(Object.values(first.reports[0].resources)[0], 5);
 assert.equal(second.reports[0].title, 'Disponibilità esaurita');
 assert.equal(view(game, second).stock, 0);
 const nextAt = tile.renewAt;
 const restored = new CampaignGame(JSON.parse(JSON.stringify(game.serialize())));
 restored.tick(nextAt);
 const restoredView = view(restored, restored.players[first.id]);
 assert.equal(restoredView.stock, restoredView.availability.stockRecovery);
 assert.ok(restoredView.stock < restoredView.availability.stockCapacity);
 restored.tick(nextAt + 24 * 60 * 60_000);
 assert.equal(view(restored, restored.players[second.id]).stock, 300);
});

test('due siti dello stesso bioma e alla stessa distanza scambiano durata per carico', () => {
 const expedition = (x,y) => {
  const {game,first,second,now}=setup();
  const tile=game.tiles[`${x}:${y}`];
  const siteFor = p => game.snapshot(p).world.tiles.find(t=>t.x===x&&t.y===y);
  second.discovered=second.discovered.filter(id=>id!==`${x}:${y}`);
  assert.equal(siteFor(second).site,undefined);
  second.discovered.push(`${x}:${y}`);
  assert.deepEqual(siteFor(first).site,siteFor(second).site);
  game.command(first,{type:'dispatch',kind:'gather',x,y},now);
  const mission=first.mission;
  // New investments affect later launches, including when a mission is in flight.
  first.research.gather=10;
  game.tick(mission.completeAt);
  assert.equal(mission.result.resources.food,mission.gatherLoad);
  assert.equal(siteFor(second).stock,300-mission.gatherLoad);
  return {mission,recovery:siteFor(first).availability.stockRecovery,biome:tile.biome};
 };
 const surface=expedition(-5,6),deep=expedition(-6,5);
 assert.equal(surface.biome,deep.biome);
 assert.equal(surface.mission.travel,deep.mission.travel);
 assert.equal(surface.mission.gatherLoad,15);
 assert.equal(deep.mission.gatherLoad,24);
 assert.equal(deep.mission.completeAt-deep.mission.arriveAt,180000);
 assert.equal(surface.mission.completeAt-surface.mission.arriveAt,120000);
 assert.equal(deep.recovery,23);
});

test('il campione condiviso si consegna al rientro e alimenta una ricetta specializzata', () => {
 const {game,first,second,now}=setup();
 const x=-6,y=5,key=`${x}:${y}`,tile=game.tiles[key];
 second.discovered.push(key);
 second.buildings.observatory=1;
 const nextAt=now+45*60_000;
 tile.sampleCache={count:1,nextAt};
 const dispatch={type:'dispatch',kind:'gather',x,y};
 game.command(first,dispatch,now);
 game.command(second,dispatch,now);
 game.tick(first.mission.completeAt);
 assert.equal(first.resources.fiber,undefined);
 assert.equal(first.reports[0].resources.fiber,1);
 assert.equal(tile.sampleCache.count,0);
 game.tick(Math.max(first.mission.returnAt,second.mission.returnAt));
 assert.equal(first.resources.fiber,1);
 assert.equal(second.resources.fiber,undefined);
 assert.ok(second.reports[0].resources.food>0);
 assert.equal(game.rates(first).fiber,undefined);
 assert.throws(()=>game.command(first,{type:'market',side:'buy',resource:'fiber'},first.updated));
 first.buildings.habitat=2;
 first.research.ecology=2;
 game.command(first,{type:'craft',id:'fieldBait'},first.updated);
 assert.equal(first.resources.fiber,0);
 game.tick(first.craftJob.end);
 assert.equal(first.equipment.fieldBait,1);
 assert.throws(()=>game.command(first,{type:'craft',id:'fieldBait'},first.updated),/Risorse insufficienti/);
 const restored=new CampaignGame(JSON.parse(JSON.stringify(game.serialize())));
 restored.tick(nextAt);
 assert.equal(restored.tiles[key].sampleCache.count,1);
});

test('il modulo rinforzato raddoppia il carico ordinario e consuma cristalli in fabbricazione', () => {
 const {game,first,now}=setup();
 Object.assign(first.buildings,{depot:2,workshop:2});
 first.research.logistics=2;
 first.resources.crystal=2;
 const normal=game.gatherLoad(first,game.members(first),'');
 game.command(first,{type:'craft',id:'fieldCargo'},now);
 assert.equal(first.resources.crystal,0);
 game.tick(first.craftJob.end);
 const expected=game.gatherLoad(first,game.members(first),'fieldCargo');
 assert.ok(Math.abs(expected-2*normal)<=1);
 game.command(first,{type:'dispatch',kind:'gather',tool:'fieldCargo',...coord},first.updated);
 assert.equal(first.equipment.fieldCargo,0);
 assert.equal(first.mission.gatherLoad,expected);
});
