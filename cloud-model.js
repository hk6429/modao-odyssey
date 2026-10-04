import {createEngine} from './engine.js';
import bank from './data/cloud-bank.json' with {type:'json'};
const engine=createEngine(bank);
export const blankSnapshot=()=>engine.fresh();
export const cleanSnapshot=value=>engine.load(value);
export const learnedCount=value=>Object.keys(value.learned).length;
export function mergeSnapshots(local,remote,{preferLocalProfile=false}={}){
 local=cleanSnapshot(local);if(!remote)return local;remote=cleanSnapshot(remote);
 const profile=preferLocalProfile?local:remote;
 const ahead=learnedCount(local)>learnedCount(remote)?local:remote;
 const other=ahead===local?remote:local;
 const merged=structuredClone(ahead);
 for(const [id,r] of Object.entries(other.learned)){
  const current=merged.learned[id];
  if(!current||r.reviews>current.reviews||r.reviews===current.reviews&&r.wrong>current.wrong)merged.learned[id]=structuredClone(r);
 }
 merged.companion=profile.companion;merged.batch=profile.batch;
 merged.choices={...other.choices,...ahead.choices};
 const candidates=[profile.draft,ahead.draft,other.draft,null];
 for(const draft of candidates){try{return cleanSnapshot({...merged,draft});}catch{}}
 throw Error('無法合併旅程，原始備份仍保留。');
}

export const learnedKeys=value=>Object.keys(value.learned);
