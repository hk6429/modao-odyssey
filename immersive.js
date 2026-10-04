// Presentation only: chapter selection never writes a learning record.
export function createImmersion({regions,companions,kind}){
 const $=s=>document.querySelector(s),hero=$('.hero'),grid=$('.journey-grid'),card=$('#chapter-card');
 document.body.classList.add('immersive',kind);
 const world=document.createElement('section');world.id='painting-world';world.className='painting-world';world.setAttribute('aria-label',kind==='literature'?'與文人同行的水墨劇場':'與旅伴同行的山海劇場');
 const heading=$('.journey-heading'),tabs=$('#region-tabs');heading.before(world);world.append(grid);heading.hidden=true;
 hero.append($('#stats'));
 if(!$('#about-footer'))$('footer').append($('#about'));

 const scroll=document.createElement('button');scroll.className='painting-scroll';scroll.textContent='走進故事 ↓';scroll.onclick=()=>enter();hero.append(scroll);
 const sheet=document.createElement('dialog');sheet.id='chapter-sheet';sheet.setAttribute('aria-label','本小關故事與任務');
 const close=document.createElement('button');close.className='close';close.id='close-chapter';close.setAttribute('aria-label','回到故事');close.textContent='×';close.onclick=()=>sheet.close();sheet.append(close,card);document.body.append(sheet);
 const drawer=document.createElement('dialog');drawer.id='scene-picker';drawer.setAttribute('aria-labelledby','scene-picker-title');
 drawer.innerHTML=`<button class="close" id="close-picker" aria-label="收起行旅目錄">×</button><p class="eyebrow">想去哪一頁風景？</p><h2 id="scene-picker-title">${kind==='literature'?'千載行旅':'山海行旅'}</h2><p>可先探看故事，學習任務依序解鎖。</p><div id="picker-progress"></div>`;
 drawer.append(tabs,$('#map-nodes'));document.body.append(drawer);
 $('#close-picker').onclick=()=>drawer.close();
 const landscape=$('#landscape');landscape.querySelector('svg').remove();
 const guide=document.createElement('div');guide.className='scene-character';guide.setAttribute('role','img');world.append(guide);
 const title=document.createElement('header');title.className='scene-heading';title.innerHTML='<p id="scene-era"></p><h2 id="scene-title"></h2><div id="scene-progress"></div>';world.append(title);
 const menu=document.createElement('button');menu.id='scene-menu';menu.className='scene-menu';menu.textContent='小關進度 ☰';menu.onclick=()=>drawer.showModal();world.append(menu);
 const dialogue=document.createElement('section');dialogue.className='scene-dialogue';dialogue.setAttribute('aria-label','旅途對話');dialogue.innerHTML='<div class="dialogue-copy"><div class="dialogue-speaker"><b id="scene-speaker"></b><span id="scene-page"></span></div><p id="scene-line" aria-live="polite"></p><div class="scene-actions"><button id="scene-back" class="scene-text">‹ 上一句</button><button id="scene-details" class="scene-text">本小關詳情</button><button id="scene-continue" class="scene-continue"></button></div></div>';world.append(dialogue);
 let selected=-1,region=0,line=0,lines=[];
 function paintDialogue(){
  $('#scene-line').textContent=lines[line]||'';$('#scene-page').textContent=`${line+1} / ${lines.length}`;
  $('#scene-back').disabled=line===0;
  const action=$('#scene-continue'),original=$('#chapter-start');
  action.textContent=line<lines.length-1?'繼續聽 →':original.textContent.trim();
  action.disabled=line===lines.length-1&&original.disabled;
 }
 $('#scene-back').onclick=()=>{line=Math.max(0,line-1);paintDialogue();};
 $('#scene-continue').onclick=()=>{if(line<lines.length-1){line++;paintDialogue();}else $('#chapter-start').click();};
 $('#scene-details').onclick=()=>openChapter();
 function center(){if(drawer.open)drawer.close();}
 function enter(){world.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 function openChapter(){center();if(!sheet.open)sheet.showModal();}
 function update(nextRegion,nextSelected){
  const changed=selected!==nextSelected;region=nextRegion;selected=nextSelected;
  const r=regions[region],c=r.mentor||companions.find(c=>c.id===$('#companion').value)||companions[0];
  const story=card.querySelector('.story-text').textContent;
  lines=story.match(/[^。！？]+[。！？]?/g)||[story];if(changed)line=0;line=Math.min(line,lines.length-1);
  $('#scene-era').textContent=`${r.name}　／　${r.subtitle}`;$('#scene-title').textContent=r.steps[selected%10];$('#scene-speaker').textContent=c.name;
  guide.setAttribute('aria-label',`${c.name}，兩頭身水墨旅伴`);
  const ci=kind==='literature'?region:companions.indexOf(c);
  guide.style.backgroundSize=kind==='literature'?'500% 200%':'300% 100%';
  guide.style.backgroundPosition=kind==='literature'?`${ci%5*25}% ${ci<5?0:100}%`:`${ci*50}% 50%`;
  landscape.classList.toggle('arrival-scene',region===0);
  landscape.setAttribute('aria-label',`${r.name}水墨故事場景`);
  paintDialogue();
 }
 return {update,enter,center,openChapter,closeChapter:()=>sheet.close()};
}
