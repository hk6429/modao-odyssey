export const DAY=86400000;
const intervals=[DAY,3*DAY,7*DAY,14*DAY,30*DAY];
export const normalize=s=>String(s).normalize('NFC').replace(/[\sˉ]/g,'').trim();
export function makeChapters(bank){const base=Math.floor(bank.length/80),extra=bank.length%80;let offset=0;return Array.from({length:80},(_,i)=>{const size=base+(i<extra?1:0),ids=bank.slice(offset,offset+size).map(q=>q.id);offset+=size;return {id:i,ids};});}
export function createEngine(bank){
 const byId=new Map(bank.map(q=>[q.id,q])),chapters=makeChapters(bank),all=new Set(byId.keys());
 const fresh=()=>({version:1,companion:'qing',batch:5,learned:{},choices:{},history:[],draft:null});
 const complete=(s,i)=>chapters[i].ids.every(id=>s.learned[id]);
 const current=s=>{const n=chapters.findIndex((_,i)=>!complete(s,i));return n<0?80:n;};
 const due=(s,now=Date.now())=>Object.keys(s.learned).filter(id=>s.learned[id].due<=now).sort((a,b)=>s.learned[a].due-s.learned[b].due);
 const stats=(s,now=Date.now())=>({learned:Object.keys(s.learned).length,xp:Object.keys(s.learned).length*10,mastered:Object.values(s.learned).filter(r=>r.days.length>=3&&r.recall>0).length,due:due(s,now).length,chapters:chapters.filter((_,i)=>complete(s,i)).length});
 function load(raw){
  const s=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);
  if(!s||s.version!==1||!['qing','yan','bear'].includes(s.companion)||![3,5,10].includes(s.batch)||!s.learned||Array.isArray(s.learned)||!s.choices||!Array.isArray(s.history))throw Error('不是有效的墨島字旅備份。');
  for(const [id,r] of Object.entries(s.learned))if(!all.has(id)||!r||!Number.isFinite(r.due)||r.due<0||!Number.isFinite(r.at)||r.at<0||!Array.isArray(r.days)||r.days.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d))||new Set(r.days).size!==r.days.length||!Number.isInteger(r.recall)||r.recall<0||!Number.isInteger(r.wrong)||r.wrong<0||!Number.isInteger(r.reviews)||r.reviews<0||!['recognition','recall'].includes(r.mode))throw Error('備份的題目或複習紀錄不正確。');
  for(const [k,v] of Object.entries(s.choices))if(!/^[0-7]$/.test(k)||![0,1].includes(v))throw Error('故事紀錄不正確。');
  if(s.history.some(h=>!h||!Number.isFinite(h.at)||!Number.isInteger(h.chapter)||h.chapter<0||h.chapter>79||!Array.isArray(h.ids)||!h.ids.length||new Set(h.ids).size!==h.ids.length||h.ids.some(id=>!chapters[h.chapter].ids.includes(id)||!s.learned[id])))throw Error('旅程紀錄不正確。');
  const evidence=s.history.flatMap(h=>h.ids);if(new Set(evidence).size!==evidence.length||evidence.length!==Object.keys(s.learned).length)throw Error('學習紀錄缺少完成證據。');
  let gap=false;for(const q of bank){if(!s.learned[q.id])gap=true;else if(gap)throw Error('備份的關卡順序不完整。');}
  if(s.draft){const d=s.draft;const validIds=x=>Array.isArray(x)&&x.length<=200&&x.every(id=>all.has(id));
   if(!['review','learn','quiz','done'].includes(d.phase)||!validIds(d.ids)||!validIds(d.queue)||!Number.isInteger(d.pos)||d.pos<0||d.pos>d.queue.length||(!['done'].includes(d.phase)&&d.pos>=d.queue.length)||!Number.isInteger(d.chapter)||d.chapter<0||d.chapter>79||!['new','review'].includes(d.kind)||!d.failed||!d.hints||Object.values(d.failed).some(v=>v!==true)||Object.values(d.hints).some(v=>v!==true)||d.ids.some(id=>!chapters[d.chapter].ids.includes(id))||new Set(d.ids).size!==d.ids.length||d.ids.length>10||d.queue.some(id=>d.phase==='review'?!s.learned[id]:!d.ids.includes(id))||d.kind==='review'&&d.ids.length||d.feedback!==null&&(!d.feedback||typeof d.feedback.correct!=='boolean'||typeof d.feedback.value!=='string'))throw Error('未完成練習紀錄不正確。');
   if(d.kind==='new'&&d.phase!=='done'&&(d.chapter!==current(s)||d.ids.some(id=>s.learned[id])))throw Error('練習草稿與進度不一致。');
  }
  return s;
 }
 function begin(s,kind='new',now=Date.now()){
  if(s.draft&&s.draft.phase!=='done')return s.draft;
  const chapter=Math.min(current(s),79),ids=kind==='new'?chapters[chapter].ids.filter(id=>!s.learned[id]).slice(0,s.batch):[];
  const review=due(s,now).slice(0,10);if(!ids.length&&!review.length)return null;
  const phase=review.length?'review':ids.length?'learn':'done';
  s.draft={kind,chapter,ids,phase,queue:review.length?review:[...ids],pos:0,failed:{},hints:{},feedback:null,earned:0};return s.draft;
 }
 const question=s=>byId.get(s.draft?.queue[s.draft.pos]);
 const mode=s=>s.draft?.feedback?.mode||(s.draft?.phase==='review'?(s.learned[question(s).id]?.mode||'recognition'):'recognition');
 function hint(s){const q=question(s);if(q&&s.draft&&!s.draft.feedback)s.draft.hints[q.id]=true;}
 function answer(s,value,now=Date.now()){
  const d=s.draft;if(!d||!['review','quiz'].includes(d.phase)||d.feedback)return null;
  const answeredMode=mode(s);
  const q=question(s),correct=normalize(value)===normalize(q.answer),independent=!d.failed[q.id]&&!d.hints[q.id];
  if(!correct){d.failed[q.id]=true;d.queue.push(q.id);if(s.learned[q.id])s.learned[q.id].wrong++;}
  if(correct&&d.phase==='review'){
   const r=s.learned[q.id],day=new Date(now+8*3600000).toISOString().slice(0,10);
   if(independent&&now>=r.due&&!r.days.includes(day)){r.days.push(day);if(mode(s)==='recall')r.recall++;}
   r.reviews++;r.due=now+(independent?intervals[Math.min(r.days.length,4)]:600000);r.mode=r.mode==='recognition'?'recall':'recognition';
  }
  d.feedback={correct,value:String(value),mode:answeredMode};return d.feedback;
 }
 function next(s,now=Date.now()){
  const d=s.draft;if(!d||d.phase==='done')return;
  if(d.phase!=='learn'&&!d.feedback)return;
  d.pos++;d.feedback=null;if(d.pos<d.queue.length)return;
  if(d.phase==='review'&&d.ids.length){d.phase='learn';d.queue=[...d.ids];d.pos=0;return;}
  if(d.phase==='learn'){d.phase='quiz';d.queue=[...d.ids];d.pos=0;return;}
  if(d.phase==='quiz'){
   const added=d.ids.filter(id=>!s.learned[id]);
   for(const id of added)s.learned[id]={at:now,due:now+(d.failed[id]||d.hints[id]?600000:DAY),days:[],recall:0,reviews:0,wrong:d.failed[id]?1:0,mode:'recognition'};
   if(added.length)s.history.push({chapter:d.chapter,ids:added,at:now});d.earned=added.length*10;
  }
  d.phase='done';d.queue=[];d.pos=0;
 }
 return {bank,chapters,byId,fresh,load,current,complete,due,stats,begin,question,mode,hint,answer,next};
}
