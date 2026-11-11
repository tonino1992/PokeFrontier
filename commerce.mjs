import {randomUUID} from 'node:crypto';
import {RECIPES} from './balance.mjs';
import {facilityState} from './workforce.mjs';

const OFFER_LIMIT = 8;
const CARGO_LIMIT = 20;
const PRICE_LIMIT = 100_000;
const OFFER_LIFETIME = 24 * 60 * 60_000;
const recipeFor = id => RECIPES.find(recipe => recipe.id === id);

export class PlayerMarket {
 constructor(game, saved) {
  this.game = game;
  this.offers = structuredClone(saved?.offers ?? []);
  this.convoys = structuredClone(saved?.convoys ?? []);
 }

 serialize() {
  return {offers:this.offers, convoys:this.convoys};
 }

 availableRovers(player) {
  const travelling = this.convoys.filter(convoy => convoy.sellerId === player.id).length;
  return Math.max(0, this.game.countItem(player, 'rover') - travelling);
 }

 travelTime(seller, buyer) {
  const distance = Math.hypot(seller.baseTile.x-buyer.baseTile.x, seller.baseTile.y-buyer.baseTile.y);
  const logistics = 1 + .08 * seller.research.logistics;
  const depot = .85 + .15 * facilityState(seller, 'depot').coverage;
  const network = 1 + this.game.allianceBonus(seller,'convoy');
  return Math.ceil(Math.max(45_000, distance * 45_000 / (logistics * depot * network)) / this.game.speedFactor);
 }

 command(player, cmd, now) {
  if (cmd.action === 'list') return this.list(player, cmd, now);
  const index = this.offers.findIndex(offer => offer.id === cmd.id);
  if (index < 0) throw Error('Offerta non più disponibile.');
  const offer = this.offers[index];
  if (cmd.action === 'cancel') {
   if (offer.sellerId !== player.id) throw Error('Puoi ritirare soltanto le tue offerte.');
   this.game.addItem(player, offer.item, offer.quantity);
   this.offers.splice(index, 1);
   return;
  }
  if (cmd.action !== 'buy') throw Error('Azione di mercato non valida.');
  if (offer.sellerId === player.id) throw Error('Non puoi acquistare la tua offerta.');
  const seller = this.game.players[offer.sellerId];
  if (!seller || !this.availableRovers(seller)) throw Error('Nessun rover del venditore disponibile.');
  const travel = this.travelTime(seller, player);
  this.game.pay(player, {credits:offer.price});
  this.offers.splice(index, 1);
  this.convoys.push({
   ...offer, buyerId:player.id, departAt:now, arriveAt:now+travel, returnAt:now+2*travel,
   delivered:false
  });
  this.game.notify(seller, 'Offerta acquistata. Rover in viaggio per la consegna.');
 }

 list(seller, cmd, now) {
  const recipe = recipeFor(cmd.item);
  if (!recipe || recipe.id === 'rover') throw Error('Scegli uno strumento da vendere.');
  if (!seller.buildings.depot || this.game.countItem(seller,'rover') < 1) throw Error('Per vendere servono Deposito logistico e un rover da carico.');
  const {quantity, price} = cmd;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > CARGO_LIMIT) throw Error('Il lotto deve contenere da 1 a 20 strumenti.');
  if (!Number.isInteger(price) || price < 1 || price > PRICE_LIMIT) throw Error('Prezzo totale da 1 a 100.000 crediti.');
  const openOffers = this.offers.filter(offer => offer.sellerId === seller.id).length;
  if (openOffers >= OFFER_LIMIT) throw Error('Hai già 8 offerte aperte.');
  if (this.game.countItem(seller, recipe.id) < quantity) throw Error('Strumenti insufficienti per questo lotto.');
  this.game.addItem(seller, recipe.id, -quantity);
  this.offers.push({id:randomUUID(),sellerId:seller.id,item:recipe.id,quantity,price,expiresAt:now+OFFER_LIFETIME/this.game.speedFactor});
 }

 advance(now) {
  this.offers = this.offers.filter(offer => {
   if (offer.expiresAt > now) return true;
   const seller = this.game.players[offer.sellerId];
   this.game.addItem(seller, offer.item, offer.quantity);
   this.game.notify(seller, 'Offerta scaduta. Il lotto è tornato in deposito.');
   return false;
  });
  for (const convoy of this.convoys) {
   if (convoy.delivered || convoy.arriveAt > now) continue;
   const seller = this.game.players[convoy.sellerId];
   const buyer = this.game.players[convoy.buyerId];
   this.game.addItem(buyer, convoy.item, convoy.quantity);
   seller.resources.credits += convoy.price;
   convoy.delivered = true;
   const name = recipeFor(convoy.item).name;
   this.game.notify(buyer, `Consegna ricevuta · ${convoy.quantity} × ${name}.`);
   this.game.notify(seller, `Consegna effettuata · +${convoy.price} crediti. Il rover rientra.`);
  }
  this.convoys = this.convoys.filter(convoy => convoy.returnAt > now);
 }

 deadlines() {
  return [...this.offers.map(offer=>offer.expiresAt), ...this.convoys.map(convoy=>convoy.delivered?convoy.returnAt:convoy.arriveAt)];
 }

 view(player) {
  const players = this.game.players;
  return {
   freeRovers:this.availableRovers(player), totalRovers:this.game.countItem(player,'rover'),
   offers:this.offers.map(offer=>{
    const seller = players[offer.sellerId];
    return {...offer,sellerName:seller.name,available:this.availableRovers(seller)>0,travel:this.travelTime(seller,player)};
   }),
   convoys:this.convoys.filter(convoy=>convoy.sellerId===player.id||convoy.buyerId===player.id)
    .map(convoy=>({...convoy,sellerName:players[convoy.sellerId].name,buyerName:players[convoy.buyerId].name}))
  };
 }
}
