const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Read-only projection: a batch or retry never becomes a completed chapter.
export function journeyProgress(engine,state,regions,index){
 const regionIndex=Math.floor(index/10),r=regions[regionIndex],current=engine.current(state);
 const chapters=engine.chapters.slice(regionIndex*10,regionIndex*10+10).map((c,i)=>{const count=c.ids.filter(id=>Object.hasOwn(state.learned,id)).length;return {index:regionIndex*10+i,title:r.steps[i],count,total:c.ids.length,done:count===c.ids.length};});
 const chapter=chapters[index%10],completed=chapters.filter(c=>c.done).length,remaining=chapter.total-chapter.count;
 return {regionIndex,region:r,chapters,chapter,completed,remaining,current,batches:Math.ceil(remaining/state.batch),batchSize:state.batch};
}
export function renderJourneyProgress(p,{compact=false}={}){
 const c=p.chapter;
 return `<section class="journey-progress" aria-label="大關與小關進度"><strong>第 ${p.regionIndex+1} 大關 · ${esc(p.region.name)}｜已過 ${p.completed} / ${p.chapters.length} 小關</strong><p>第 ${c.index%10+1} 小關「${esc(c.title)}」· 已收集 ${c.count} / ${c.total} 題${p.remaining?`，還差 ${p.remaining} 題`:' · 已過關'}</p><progress value="${c.count}" max="${c.total}" aria-label="本小關已收集題數"></progress>${compact?'':`<p class="progress-note">${p.remaining?`每批 ${p.batchSize} 題，約還有 ${p.batches} 批（含目前尚未收集的題目）。完成整批才計入；複習與答錯重練不增加關卡題數。`:'本小關所有題目已收集。'} 本大關還有 ${p.chapters.length-p.completed} 小關。</p><details><summary>查看 ${p.chapters.length} 個小關的完成清單</summary><ol>${p.chapters.map(c=>`<li ${c.index===p.current?'aria-current="step"':''}>${c.done?'✓ 已完成':c.index===p.current?'→ 進行中':'○ 未完成'} · ${esc(c.title)} <small>${c.count}/${c.total} 題</small></li>`).join('')}</ol></details>`}</section>`;
}
export function renderStoryThread(story,{done=false,review=false,remaining=0}={}){
 if(review)return '<section class="story-thread"><p><b>這次重逢</b>　你溫習了已帶回的文字。故事仍停在原來的小關，複習不會提前解開後續劇情。</p></section>';
 return `<section class="story-thread"><p><b>前情</b>　${esc(story.before)}</p><p><b>${done?'這次的改變':'眼前任務'}</b>　${esc(done?story.resolution:story.mission)}</p><p><b>接下來</b>　${esc(done?story.next:`先把這一小關剩下的 ${remaining} 題收齊，${story.promise}`)}</p></section>`;
}
