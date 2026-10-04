import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEngine} from '../engine.js';
import {regions,chapterStory} from '../story.js';
import {journeyProgress,renderJourneyProgress,renderStoryThread} from '../journey-progress.js';
const e=createEngine(JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url))));
const time=Date.parse('2026-10-04T07:00:00Z');
function finish(s){let guard=1000;while(s.draft.phase!=='done'&&guard--){if(s.draft.phase!=='learn')e.answer(s,e.question(s).answer,time);e.next(s,time);}assert.ok(guard>0);}
test('batch completion, retries, reload and batch-size changes preserve the real small-quest goal',()=>{
 let s=e.fresh();s.batch=3;const total=e.chapters[0].ids.length;
 assert.equal(journeyProgress(e,s,regions,0).remaining,total);e.begin(s,'new',time);
 while(s.draft.phase==='learn')e.next(s,time);e.answer(s,'wrong',time);
 assert.equal(journeyProgress(e,s,regions,0).chapter.count,0);e.next(s,time);finish(s);s=e.load(JSON.stringify(s));
 let p=journeyProgress(e,s,regions,0);assert.equal(p.chapter.count,3);assert.equal(p.completed,0);assert.equal(p.remaining,total-3);
 s.batch=10;p=journeyProgress(e,s,regions,0);assert.equal(p.batches,Math.ceil((total-3)/10));assert.equal(p.remaining,total-3);
 while(!e.complete(s,0)){e.begin(s,'new',time);finish(s);}
 p=journeyProgress(e,s,regions,0);assert.equal(p.completed,1);assert.equal(p.remaining,0);assert.equal(journeyProgress(e,s,regions,1).chapter.count,0);
 const html=renderJourneyProgress(p);assert.match(html,/已過 1 \/ 10 小關/);assert.match(html,/✓ 已完成/);assert.match(html,/→ 進行中/);
});
test('all story steps have causality; partial batches and review never reveal chapter resolution',()=>{
 for(let i=0;i<e.chapters.length;i++){
 const story=chapterStory(i,0);for(const key of ['before','mission','resolution','next','promise'])assert.ok(story[key]?.length>5,`${i}:${key}`);
 const partial=renderStoryThread(story,{remaining:7});assert.match(partial,/剩下的 7 題/);assert.ok(!partial.includes(`<b>這次的改變</b>`));
 const done=renderStoryThread(story,{done:true});assert.ok(done.includes(story.resolution));
 const review=renderStoryThread(story,{done:true,review:true});assert.ok(!review.includes(story.resolution));assert.match(review,/不會提前/);
 }
});
