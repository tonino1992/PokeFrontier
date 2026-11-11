import fs from 'node:fs';
import path from 'node:path';
export async function openStorage(dir,engine='json'){
 fs.mkdirSync(dir,{recursive:true});const legacy=path.join(dir,'world.json');
 if(engine==='sqlite'){
  const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(path.join(dir,'frontier.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS world (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL, updated INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS accounts (name TEXT PRIMARY KEY, player_id TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL);');
  const save=db.prepare('INSERT INTO world(id,state,updated) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state, updated=excluded.updated');
  const firstImport=!db.prepare('SELECT id FROM world WHERE id=1').get();
  if(firstImport&&fs.existsSync(legacy)){db.exec('BEGIN IMMEDIATE');try{save.run(fs.readFileSync(legacy,'utf8'),Date.now());const accountsFile=path.join(dir,'accounts.json');if(fs.existsSync(accountsFile))for(const a of Object.values(JSON.parse(fs.readFileSync(accountsFile,'utf8'))))db.prepare('INSERT OR IGNORE INTO accounts(name,player_id,salt,hash) VALUES(?,?,?,?)').run(a.name.toLowerCase(),a.player_id,a.salt,a.hash);db.exec('COMMIT')}catch(err){db.exec('ROLLBACK');throw err}}
  return{load:()=>{const row=db.prepare('SELECT state FROM world WHERE id=1').get();return row?JSON.parse(row.state):null},save:state=>save.run(JSON.stringify(state),Date.now()),account:name=>db.prepare('SELECT * FROM accounts WHERE name=?').get(name.toLowerCase()),hasAccount:id=>!!db.prepare('SELECT name FROM accounts WHERE player_id=?').get(id),register:(a,state)=>{if(state)db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO accounts(name,player_id,salt,hash) VALUES(?,?,?,?)').run(a.name.toLowerCase(),a.player_id,a.salt,a.hash);if(state){save.run(JSON.stringify(state),Date.now());db.exec('COMMIT')}}catch(err){if(state)db.exec('ROLLBACK');throw err}},close:()=>db.close(),engine};
 }
 let accounts=fs.existsSync(path.join(dir,'accounts.json'))?JSON.parse(fs.readFileSync(path.join(dir,'accounts.json'),'utf8')):{};
 const atomic=(file,value)=>{fs.writeFileSync(file+'.tmp',JSON.stringify(value));fs.renameSync(file+'.tmp',file)};
 return{load:()=>fs.existsSync(legacy)?JSON.parse(fs.readFileSync(legacy,'utf8')):null,save:state=>atomic(legacy,state),account:name=>accounts[name.toLowerCase()],hasAccount:id=>Object.values(accounts).some(a=>a.player_id===id),register:a=>{if(accounts[a.name.toLowerCase()]||Object.values(accounts).some(x=>x.player_id===a.player_id))throw Error('Account già registrato.');accounts[a.name.toLowerCase()]=a;atomic(path.join(dir,'accounts.json'),accounts)},close:()=>{},engine};
}
