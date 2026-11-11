import {randomBytes,scrypt,timingSafeEqual,randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export async function passwordRecord(password){if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Password da 12 a 128 caratteri.');const salt=randomBytes(16).toString('hex');return{salt,hash:(await derive(password,salt,64)).toString('hex')}}
export async function verifyPassword(password,record){if(typeof password!=='string'||password.length>128)return false;const hash=await derive(password,record?.salt||'frontier-dummy-salt',64),expected=Buffer.from(record?.hash||'00'.repeat(64),'hex');return !!record&&hash.length===expected.length&&timingSafeEqual(hash,expected)}
export function mintSession(game,id){const token=randomUUID()+randomUUID();game.sessions[token]={playerId:id,expiresAt:Date.now()+30*86400000};return token}
