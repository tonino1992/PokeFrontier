import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('server HTTP: sessioni, isolamento, stream live, salvataggio e riavvio',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'pokefrontier-test-'));const port=32100+Math.floor(Math.random()*1000),url=`http://127.0.0.1:${port}`;
 let proc;const start=async()=>{proc=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Timeout avvio server')),7000);proc.once('error',reject);proc.stdout.on('data',data=>{if(String(data).includes('pronto')){clearTimeout(timer);resolve()}});proc.stderr.on('data',data=>{clearTimeout(timer);reject(Error(String(data)))})})};
 const stop=async()=>{if(!proc||proc.exitCode!==null)return;const ended=new Promise(resolve=>proc.once('exit',resolve));proc.kill();await ended};
 const request=(endpoint,data,cookie,origin)=>fetch(url+endpoint,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(data?{body:JSON.stringify(data)}:{})});
 try{await start();assert.equal((await request('/api/me')).status,401);assert.equal((await request('/api/command',{type:'move',x:1,y:1})).status,401);assert.equal((await request('/api/join',{name:'Red',starter:'bulbasaur'},null,'https://malicious.example')).status,403);
 const a=await request('/api/join',{name:'Red',starter:'bulbasaur'});assert.equal(a.status,200);const cookieA=a.headers.get('set-cookie').split(';')[0],red=await a.json();const b=await request('/api/join',{name:'Blue',starter:'squirtle'});const cookieB=b.headers.get('set-cookie').split(';')[0],blue=await b.json();assert.notEqual(red.me.id,blue.me.id);assert.equal((await request('/api/join',{name:'Third',starter:'squirtle'},cookieA)).status,409);

 const catalog=await(await request('/api/catalog')).json();assert.equal(Object.values(catalog.workforce.talents).flat().length,51);
 assert.equal(Object.keys(catalog.technology).length,400);assert.equal((await request('/api/progression')).status,401);assert.equal((await request('/api/technology?kind=building&id=lab')).status,401);
 const progression=await(await request('/api/progression',null,cookieA)).json();assert.equal(Object.keys(progression).length,20);
 const technology=await(await request('/api/technology?kind=building&id=habitat',null,cookieA)).json();assert.equal(technology.levels.length,21);assert.equal(technology.levels[2].metrics.find(m=>m.label==='Membri della squadra').value,2);assert.ok(technology.levels[2].cost.materials>0);assert.ok(technology.levels[2].duration>0);assert.equal((await request('/api/technology?kind=building&id=invalid',null,cookieA)).status,400);
 const redId=red.me.creatures[0].id,blueId=blue.me.creatures[0].id;
 assert.equal((await request('/api/work-preview',{type:'assign',creatureId:redId,structure:'farm'})).status,401);
 const preview=await(await request('/api/work-preview',{type:'assign',creatureId:redId,structure:'farm'},cookieA)).json();assert.equal(preview.after.team,0);assert.ok(preview.after.hourly.food>preview.before.hourly.food);
 let check=await(await request('/api/me',null,cookieA)).json();assert.ok(!check.me.creatures[0].assignment);assert.equal(check.me.team.length,1);
 assert.equal((await request('/api/command',{type:'assign',creatureId:blueId,structure:'farm'},cookieA)).status,400);
 assert.equal((await request('/api/command',{type:'chooseTalent',creatureId:redId,talentType:'erba'},cookieA)).status,200);
 assert.equal((await request('/api/command',{type:'chooseTalent',creatureId:redId,talentType:'veleno'},cookieA)).status,400);
 assert.equal((await request('/api/command',{type:'assign',creatureId:redId,structure:'farm'},cookieA)).status,200);
 check=await(await request('/api/me',null,cookieA)).json();assert.equal(check.me.creatures[0].assignment,'farm');assert.equal(check.me.team.length,0);
 assert.equal((await request('/api/command',{type:'assign',creatureId:redId,structure:null},cookieA)).status,200);
 assert.equal((await request('/api/command',{type:'team',ids:[redId]},cookieA)).status,200);
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),3000);const stream=await fetch(url+'/api/events',{headers:{Cookie:cookieA},signal:ac.signal});assert.equal(stream.headers.get('content-type'),'text/event-stream');const reader=stream.body.getReader(),decoder=new TextDecoder();let message='';while(!message.includes('\n\n')){const part=await reader.read();if(part.done)break;message+=decoder.decode(part.value,{stream:true});assert.ok(message.length<1000000)}clearTimeout(timeout);assert.ok(message.includes('data: '));assert.ok(message.includes('Red'));ac.abort();
 assert.equal((await request('/api/command',{type:'dispatch',kind:'survey',x:-5,y:6},cookieA)).status,200);assert.equal((await request('/api/command',{type:'build',id:'invalid'},cookieA)).status,400);const snap=await(await request('/api/me',null,cookieB)).json();assert.equal(snap.me.name,'Blue');assert.equal(snap.world.players.find(p=>p.id===red.me.id)?.resources,undefined);assert.equal(snap.world.tiles.length,1089);
 const page=await request('/');assert.match(await page.text(),/PokéFrontier/);assert.ok(page.headers.get('content-security-policy').includes('raw.githubusercontent.com'));assert.equal((await request('/data/world.json')).status,404);
 // La persistenza periodica viene verificata senza dipendere dai segnali Windows.
 await new Promise(r=>setTimeout(r,5300));const saved=JSON.parse(await readFile(path.join(dir,'world.json'),'utf8'));assert.equal(Object.keys(saved.players).length,2);await stop();await start();const restored=await(await request('/api/me',null,cookieA)).json();assert.equal(restored.me.name,'Red');assert.equal(restored.me.creatures[0].species,'bulbasaur');assert.equal(restored.me.creatures[0].talent.type,'erba');
 }finally{await stop();const resolved=path.resolve(dir);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('pokefrontier-test-'));await rm(resolved,{recursive:true,force:true})}
});
