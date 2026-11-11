export const STOCK_CAPACITY = 300;
const STOCK_INTERVAL = 10 * 60_000;
const STOCK_RECOVERY = {forest: 30, grass: 30, mountain: 20, lake: 15, wetland: 15, ruins: 10};
const LEGENDARY = new Set(['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew']);
const DEEP_SITES = {
 forest: 'Radici nutrienti', grass: 'Campo di bacche', mountain: 'Vena profonda',
 lake: 'Sorgente minerale', wetland: 'Bacino di estrazione', ruins: 'Deposito interrato'
};
export const FIELD_MATERIALS = {
 fiber: {name:'Fibra vegetale',biomes:['forest','grass','wetland']},
 crystal: {name:'Cristallo grezzo',biomes:['mountain','lake','ruins']}
};
const SAMPLE_CAPACITY = 3;
const SAMPLE_INTERVAL = 45 * 60_000;

export function gatheringSite(tile) {
 const key = ((tile.x * 73856093) ^ (tile.y * 19349663)) >>> 0;
 if (key % 3 === 0) return {type:'deep',name:DEEP_SITES[tile.biome],load:1.6,work:1.5,recovery:.75};
 return {type:'surface',name:'Raccolta di superficie',load:1,work:1,recovery:1};
}

function stockRecovery(tile) {
 return Math.round(STOCK_RECOVERY[tile.biome] * gatheringSite(tile).recovery);
}

export function fieldSample(tile) {
 if (gatheringSite(tile).type !== 'deep') return null;
 const id = Object.keys(FIELD_MATERIALS).find(key => FIELD_MATERIALS[key].biomes.includes(tile.biome));
 return {id,count:tile.sampleCache?.count ?? SAMPLE_CAPACITY,capacity:SAMPLE_CAPACITY,nextAt:tile.sampleCache?.nextAt ?? null};
}

export function collectSample(tile, now, speed) {
 const sample = fieldSample(tile);
 if (!sample?.count) return null;
 tile.sampleCache = {count:sample.count-1,nextAt:sample.nextAt ?? now+SAMPLE_INTERVAL/speed};
 return sample.id;
}

export function populationCapacity(species) {
 return LEGENDARY.has(species) ? 1 : 3;
}

export function populationCount(tile, species) {
 return tile.populations?.[species]?.count ?? populationCapacity(species);
}

function populationInterval(species, speed) {
 return (LEGENDARY.has(species) ? 360 : 30) * 60_000 / speed;
}

export function consumePopulation(tile, species, now, speed) {
 const count = populationCount(tile, species);
 if (count < 1) return false;
 tile.populations ??= {};
 tile.populations[species] = {
  count: count - 1,
  nextAt: tile.populations[species]?.nextAt ?? now + populationInterval(species, speed)
 };
 return true;
}

export function consumeStock(tile, amount, now, speed) {
 tile.stock -= amount;
 if (amount > 0 && !tile.renewAt) tile.renewAt = now + STOCK_INTERVAL / speed;
}

export function advanceHabitat(tile, now, speed) {
 const cache = tile.sampleCache;
 if (cache && cache.nextAt <= now) {
  const interval = SAMPLE_INTERVAL / speed;
  const steps = 1 + Math.floor((now - cache.nextAt) / interval);
  cache.count += steps;
  if (cache.count >= SAMPLE_CAPACITY) delete tile.sampleCache;
  else cache.nextAt += steps * interval;
 }
 if (tile.renewAt && tile.renewAt <= now) {
  const interval = STOCK_INTERVAL / speed;
  const steps = 1 + Math.floor((now - tile.renewAt) / interval);
  tile.stock = Math.min(STOCK_CAPACITY, tile.stock + steps * stockRecovery(tile));
  tile.renewAt = tile.stock < STOCK_CAPACITY ? tile.renewAt + steps * interval : 0;
 }
 for (const [species, population] of Object.entries(tile.populations ?? {})) {
  if (population.nextAt > now) continue;
  const interval = populationInterval(species, speed);
  const steps = 1 + Math.floor((now - population.nextAt) / interval);
  population.count += steps;
  if (population.count >= populationCapacity(species)) delete tile.populations[species];
  else population.nextAt += steps * interval;
 }
 if (tile.populations && !Object.keys(tile.populations).length) delete tile.populations;
}

export function habitatAvailability(tile) {
 return {
  stockCapacity: STOCK_CAPACITY,
  stockRecovery: Math.min(STOCK_CAPACITY - tile.stock, stockRecovery(tile)),
  stockNextAt: tile.renewAt || null,
  populations: Object.fromEntries(tile.encounters.map(species => [species, {
   count: populationCount(tile, species),
   capacity: populationCapacity(species),
   nextAt: tile.populations?.[species]?.nextAt ?? null
  }]))
 };
}
