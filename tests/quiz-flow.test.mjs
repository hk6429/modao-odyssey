import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createEngine} from '../engine.js';
const engine=createEngine(JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url))));
const code=readFileSync(new URL('../app.js',import.meta.url),'utf8').match(/function submit\(value\)\{[^\n]+/)[0];
function harness(){
 const state=engine.fresh();state.batch=3;engine.begin(state,'new');while(state.draft.phase==='learn')engine.next(state);
 let stored=null,renders=0;const node={setAttribute(){},focus(){}};
 const context=vm.createContext({state,engine,persist:()=>{stored=JSON.stringify(state);},renderLesson:()=>renders++,render(){},lesson:{scrollTop:99},$:()=>node});
 vm.runInContext(code,context);return {state,submit:context.submit,saved:()=>engine.load(stored),renders:()=>renders};
}
test('correct answer advances immediately; final answer saves earned XP exactly once',()=>{
 const h=harness();h.submit(engine.question(h.state).answer);assert.equal(h.state.draft.pos,1);assert.equal(h.state.draft.feedback,null);assert.equal(h.saved().draft.pos,1);
 while(h.state.draft.phase!=='done')h.submit(engine.question(h.state).answer);
 assert.equal(engine.stats(h.saved()).xp,30);h.submit('again');assert.equal(engine.stats(h.saved()).xp,30);
});
test('wrong answer holds its explanation across reload; another submit cannot skip it',()=>{
 const h=harness(),id=engine.question(h.state).id;h.submit('wrong');assert.equal(h.state.draft.pos,0);assert.equal(h.state.draft.feedback.correct,false);assert.equal(h.saved().draft.feedback.correct,false);h.submit(engine.question(h.state).answer);assert.equal(h.renders(),1);assert.equal(h.state.draft.pos,0);assert.equal(h.state.draft.queue.at(-1),id);assert.equal(engine.stats(h.saved()).xp,0);
 engine.next(h.state);assert.equal(h.state.draft.pos,1);
});
