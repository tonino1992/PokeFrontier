import {CampaignGame} from './campaign.mjs';
import {RECIPES} from './balance.mjs';
import {fieldSample} from './habitat.mjs';
import {laborCost} from './workforce.mjs';

let game = new CampaignGame(null, {random: () => 0.25});
const seller = game.create('Esploratore', 'bulbasaur').p;
const buyer = game.create('Ricercatore', 'squirtle').p;
const start = buyer.updated;
let now = start;
const minutes = elapsed => Math.round(elapsed / 6000) / 10;
function advance(end) {
 now = Math.ceil(end);
 game.tick(now);
}

function fund(player, cost) {
 let wait = 0;
 for (const [resource, amount] of Object.entries(cost)) {
  const deficit = amount - (player.resources[resource] ?? 0);
  if (deficit <= 0) continue;
  const rate = game.rates(player)[resource];
  if (!rate || amount > game.cap(player)) throw Error('Fabbisogno non coperto: ' + resource);
  wait = Math.max(wait, deficit / rate);
 }
 if (wait) advance(now + wait * 1000 + 1);
}

function ensure(player, type, id, level) {
 const levels = type === 'build' ? player.buildings : player.research;
 while (levels[id] < level) {
  const lock = type === 'build' ? game.buildingLock(player, id) : game.researchLock(player, id);
  for (const [group, requirements] of Object.entries(lock.requirements)) {
   for (const [dependency, minimum] of Object.entries(requirements)) {
    ensure(player, group === 'buildings' ? 'build' : 'research', dependency, minimum);
   }
  }
  fund(player, type === 'build' ? game.buildCost(player,id) : game.researchCost(player,id));
  game.command(player, {type,id}, now);
  advance((type === 'build' ? player.buildJob : player.researchJob).end);
 }
}

function craft(player, id) {
 const recipe = RECIPES.find(entry => entry.id === id);
 fund(player, laborCost(player, recipe.structure, recipe.cost));
 game.command(player, {type:'craft',id}, now);
 advance(player.craftJob.end);
}

function mission(player, kind, {x,y}) {
 game.command(player, {type:'dispatch',kind,x,y}, now);
 advance(player.mission.returnAt);
}

function collectFiber(player) {
 const {x,y} = player.baseTile;
 const tile = Object.values(game.tiles)
  .filter(tile => fieldSample(tile)?.id === 'fiber' && tile.stock && tile.difficulty <= 2)
  .filter(tile => !Object.values(game.players).some(other => other.baseTile.x === tile.x && other.baseTile.y === tile.y))
  .sort((a,b) => Math.hypot(a.x-x,a.y-y) - Math.hypot(b.x-x,b.y-y))[0];
 if (!player.discovered.includes(tile.x + ':' + tile.y)) mission(player,'survey',tile);
 mission(player,'gather',tile);
}

ensure(seller,'build','habitat',2);
ensure(seller,'research','ecology',2);
collectFiber(seller);
craft(seller,'fieldBait');
const firstBait = minutes(now-start);
ensure(seller,'build','depot',1);
craft(seller,'rover');
const firstRover = minutes(now-start);

const price = 60;
game.command(seller,{type:'trade',action:'list',item:'fieldBait',quantity:1,price},now);
game.command(buyer,{type:'trade',action:'buy',id:game.playerMarket.offers[0].id},now);
const convoy = game.playerMarket.convoys[0];
advance(convoy.arriveAt);
if (game.countItem(buyer,'fieldBait') !== 1) throw Error('Consegna mancante.');

game.command(seller,{type:'alliance',action:'create',name:'Ricerca comune'},now);
game.command(buyer,{type:'alliance',action:'join',id:seller.alliance},now);
const researchBefore = game.duration('research',seller,'ecology');
for (const player of [seller,buyer]) {
 fund(player,{food:500});
 game.command(player,{type:'allianceDonate',resource:'food',quantity:500},now);
}
const researchAfter = game.duration('research',seller,'ecology');

const alliancePoints = game.allianceDevelopment.view(seller).points;
game = new CampaignGame(null, {random: () => 0.25});
const solo = game.create('Solitario', 'squirtle').p;
now = solo.updated;
const soloStart = now;
ensure(solo,'build','habitat',2);
ensure(solo,'research','ecology',2);
collectFiber(solo);
craft(solo,'fieldBait');
const soloMinutes = minutes(now-soloStart);

const population = new CampaignGame();
let registrationLimit;
for (let index = 0; index < 100; index++) {
 try {
  population.create('Ricercatore ' + index, 'bulbasaur');
 } catch (error) {
  registrationLimit = error.message;
  break;
 }
}
const players = Object.values(population.players);
const positions = new Set(players.map(({baseTile}) => baseTile.x + ':' + baseTile.y));
const dispatchAt = Date.now();
for (const player of players) {
 const {x,y} = player.baseTile;
 population.command(player,{type:'dispatch',kind:'survey',x:x+1,y},dispatchAt);
}
const returnedAt = Math.max(...players.map(player => player.mission.returnAt));
population.tick(returnedAt);
const completedSurveys = players.filter(player => !player.mission && player.reports.some(report => report.returned)).length;
if (positions.size !== 100 || completedSurveys !== 100) throw Error('Prova su 100 avamposti fallita.');
console.log(JSON.stringify({
 firstBaitMinutes:firstBait, firstRoverMinutes:firstRover,
 market:{price, deliveryMinutes:minutes(convoy.arriveAt-convoy.departAt), roundTripMinutes:minutes(convoy.returnAt-convoy.departAt)},
 soloBaitMinutes:soloMinutes,
 alliance:{foodPerDonor:500, points:alliancePoints, researchSecondsSaved:(researchBefore-researchAfter)/1000},
 map:{requested:100, registered:Object.keys(population.players).length, distinctBases:positions.size, completedSurveys, registrationLimit}
},null,2));
