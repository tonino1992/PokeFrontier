const RATES = {materials:10, food:10, reagents:5};
const LEVELS = [
 {points:100, name:'Laboratorio in rete', description:'+5% velocità delle nuove ricerche', perk:'research', bonus:.05},
 {points:300, name:'Rete di raccolta', description:'+10% carico ordinario delle nuove raccolte', perk:'gather', bonus:.10},
 {points:650, name:'Rete logistica', description:'+10% velocità dei nuovi convogli', perk:'convoy', bonus:.10}
];

export class AllianceDevelopment {
 constructor(game, saved, legacyProjects=[]) {
  this.game=game;
  this.records=structuredClone(saved??{});
  for (const project of legacyProjects) {
   if (project.status!=='active') continue;
   for (const [id, contribution] of Object.entries(project.contributions)) {
    const player=game.players[id];
    if (!player) continue;
    if (contribution.samples) player.resources[project.material]=(player.resources[project.material]||0)+contribution.samples;
    if (contribution.scanners) game.addItem(player,'scanner',contribution.scanners);
   }
  }
 }

 level(id) {
  const points=Object.hasOwn(this.records,id)?this.records[id].points:0;
  return LEVELS.filter(level=>points>=level.points).length;
 }

 bonus(player, perk) {
  return LEVELS.slice(0,this.level(player.alliance)).find(level=>level.perk===perk)?.bonus??0;
 }

 donate(player, {resource,quantity}) {
  const id=player.alliance;
  if (!id || !Object.hasOwn(this.game.alliances,id)) throw Error('Entra in un’alleanza per donare.');
  if (!Object.hasOwn(RATES,resource)) throw Error('Scegli materiali, cibo o reagenti.');
  const rate=RATES[resource];
  if (!Number.isSafeInteger(quantity)||quantity<rate||quantity%rate!==0) throw Error(`Dona multipli di ${rate} unità.`);
  const previousLevel=this.level(id);
  if (previousLevel===LEVELS.length) throw Error('L’alleanza ha già sbloccato tutti i vantaggi.');
  const points=quantity/rate;
  const currentPoints=this.records[id]?.points??0;
  if (points>LEVELS.at(-1).points-currentPoints) throw Error('La donazione supera i punti ancora necessari.');
  this.game.pay(player,{[resource]:quantity});
  const record=this.records[id]??={points:0,contributors:{}};
  record.points+=points;
  record.contributors[player.id]=(record.contributors[player.id]||0)+points;
  const newLevel=this.level(id);
  if (newLevel>previousLevel) {
   for (const member of Object.values(this.game.players)) {
    if (member.alliance===id) this.game.notify(member,`Alleanza al livello ${newLevel}. Sbloccato ${LEVELS.slice(previousLevel,newLevel).map(level=>level.name).join(', ')}.`);
   }
  }
 }

 view(player) {
  if (!player.alliance || !Object.hasOwn(this.game.alliances,player.alliance)) return null;
  const record=this.records[player.alliance];
  return {
   points:record?.points??0, level:this.level(player.alliance), levels:LEVELS, rates:RATES,
   personal:record?.contributors[player.id]??0
  };
 }
}
