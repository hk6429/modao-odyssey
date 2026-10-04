import { readFile, writeFile, mkdir, copyFile, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files=['ziyin-zixing-elementary.json','ziyin-zixing-junior.json'];
const unique=new Map(), sources=[];
let rawCount=0;
for(const file of files){
 const raw=await readFile(new URL('../data/'+file,import.meta.url));
 const rows=JSON.parse(raw);rawCount+=rows.length;
 sources.push({file,count:rows.length,sha256:createHash('sha256').update(raw).digest('hex')});
 for(const q of rows){
  if(!q.id||!q.options.includes(q.answer)||new Set(q.options).size!==q.options.length||!q.explain)throw Error('Invalid '+q.id);
  const key=JSON.stringify([q.question,q.answer]);
  if(unique.has(key)){unique.get(key).sourceRefs.push({id:q.id,file,source:q.source});continue;}
  unique.set(key,{...q,sourceRefs:[{id:q.id,file,source:q.source}]});
 }
}
const rank={'易':0,'中':1,'難':2};
const questions=[...unique.values()].sort((a,b)=>rank[a.difficulty]-rank[b.difficulty]||(a.level==='國小'?0:1)-(b.level==='國小'?0:1));
if(new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('Duplicate IDs');
await writeFile(new URL('../data/questions.json',import.meta.url),JSON.stringify(questions));
await writeFile(new URL('../docs/data-audit.json',import.meta.url),JSON.stringify({rawCount,count:questions.length,duplicateCount:rawCount-questions.length,sources,types:Object.fromEntries(['字音','字形'].map(t=>[t,questions.filter(q=>q.type===t).length]))},null,2));
const out=new URL('../dist/',import.meta.url);await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','immersive.css','immersive.js','app.js', 'choice-keyboard.js','engine.js','story.js','_headers'])await copyFile(new URL('../'+file,import.meta.url),new URL(file,out));
await mkdir(new URL('data/',out),{recursive:true});await copyFile(new URL('../data/questions.json',import.meta.url),new URL('data/questions.json',out));
await mkdir(new URL('assets/',out),{recursive:true});
for(const file of await readdir(new URL('../assets/',import.meta.url))){if(/\.(webp|svg)$/.test(file))await copyFile(new URL('../assets/'+file,import.meta.url),new URL('assets/'+file,out));}
console.log(`Built ${questions.length} unique questions from ${rawCount} rows; 80 chapters, 8 locations.`);
