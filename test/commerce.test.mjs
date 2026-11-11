import test from 'node:test';
import assert from 'node:assert/strict';
import {CampaignGame} from '../campaign.mjs';

function setup() {
 const game = new CampaignGame(null,{random:()=>0});
 const {p:seller} = game.create('Venditore','bulbasaur');
 const {p:buyer} = game.create('Acquirente','squirtle');
 Object.assign(seller.buildings,{hq:2,quarry:2,habitat:2,depot:1});
 Object.assign(seller.research,{ecology:2,logistics:1});
 Object.assign(buyer.buildings,{hq:2,lab:1,habitat:1});
 buyer.research.ecology=1;
 return {game,seller,buyer,now:buyer.updated};
}

test('raccolta, fabbricazione, vendita e uso dopo consegna persistente',()=>{
 const {game,seller,buyer,now}=setup();
 game.command(seller,{type:'dispatch',kind:'gather',x:-6,y:5},now);
 game.tick(seller.mission.returnAt);
 game.command(seller,{type:'craft',id:'fieldBait'},seller.updated);
 game.tick(seller.craftJob.end);
 game.command(seller,{type:'craft',id:'rover'},seller.updated);
 game.tick(seller.craftJob.end);
 assert.equal(seller.equipment.rover,1);
 const before=seller.resources.credits, buyerBefore=buyer.resources.credits;
 game.command(seller,{type:'trade',action:'list',item:'fieldBait',quantity:1,price:60},seller.updated);
 assert.equal(seller.equipment.fieldBait,0);
 const {id}=game.playerMarket.offers[0];
 game.command(buyer,{type:'trade',action:'buy',id},seller.updated);
 assert.equal(buyer.resources.credits,buyerBefore-60);
 assert.equal(seller.resources.credits,before);
 assert.equal(buyer.equipment.fieldBait,undefined);
 assert.equal(game.playerMarket.availableRovers(seller),0);
 assert.throws(()=>game.command(buyer,{type:'trade',action:'buy',id},seller.updated),/non più disponibile/);
 game.command(seller,{type:'trade',action:'list',item:'ball',quantity:1,price:10},seller.updated);
 const queued=game.playerMarket.offers[0];
 assert.throws(()=>game.command(buyer,{type:'trade',action:'buy',id:queued.id},seller.updated),/Nessun rover/);
 assert.equal(buyer.resources.credits,buyerBefore-60);
 const trip=game.playerMarket.convoys[0];
 const restored=new CampaignGame(JSON.parse(JSON.stringify(game.serialize())),{random:()=>0});
 const savedSeller=restored.players[seller.id], savedBuyer=restored.players[buyer.id];
 restored.tick(trip.arriveAt);
 assert.equal(savedBuyer.equipment.fieldBait,1);
 assert.equal(savedSeller.resources.credits,before+60);
 assert.equal(restored.playerMarket.availableRovers(savedSeller),0);
 restored.tick(trip.returnAt);
 assert.equal(savedBuyer.equipment.fieldBait,1);
 assert.equal(savedSeller.resources.credits,before+60);
 assert.equal(restored.playerMarket.availableRovers(savedSeller),1);
 assert.equal(restored.recipeLock(savedBuyer,'fieldBait').ok,false);
 restored.tiles['-4:6'].encounters=['caterpie'];
 restored.command(savedBuyer,{type:'dispatch',kind:'capture',species:'caterpie',tool:'fieldBait',x:-4,y:6},trip.returnAt);
 assert.equal(savedBuyer.equipment.fieldBait,0);
 restored.tick(savedBuyer.mission.returnAt);
 assert.equal(savedBuyer.creatures.length,2);
});

test('escrow restituito alla scadenza e al ritiro, prezzo e rover convalidati dal server',()=>{
 const {game,seller,buyer,now}=setup();
 const list={type:'trade',action:'list',item:'ball',quantity:1,price:50};
 assert.throws(()=>game.command(seller,list,now),/rover/);
 seller.equipment.rover=1;
 assert.throws(()=>game.command(seller,{...list,item:'rover'},now),/strumento/);
 assert.throws(()=>game.command(seller,{...list,price:-1},now),/Prezzo/);
 const balls=seller.balls;
 game.command(seller,list,now);
 const first=game.playerMarket.offers[0];
 assert.equal(seller.balls,balls-1);
 assert.throws(()=>game.command(buyer,{type:'trade',action:'cancel',id:first.id},now),/soltanto/);
 assert.throws(()=>game.command(seller,{type:'trade',action:'buy',id:first.id},now),/tua offerta/);
 game.tick(first.expiresAt);
 assert.equal(seller.balls,balls);
 game.command(seller,list,seller.updated);
 const second=game.playerMarket.offers[0];
 game.command(seller,{type:'trade',action:'cancel',id:second.id},seller.updated);
 assert.equal(seller.balls,balls);
 assert.equal(game.playerMarket.offers.length,0);
});
