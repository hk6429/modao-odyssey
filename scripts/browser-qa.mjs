import {chromium} from 'playwright-core';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const bank=JSON.parse(await readFile(new URL('../data/questions.json',import.meta.url))),byId=new Map(bank.map(q=>[q.id,q]));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
await page.goto('http://127.0.0.1:4198/?test=1');await page.locator('#load-status').waitFor({state:'hidden'});await page.screenshot({path:new URL('../artifacts/desktop.png',import.meta.url).pathname,fullPage:true});
await page.selectOption('#batch','3');await page.click('#hero-start');await page.click('[data-opening-choice="0"]');
assert.match(await page.locator('#lesson-title').innerText(),/./);await page.click('#next-question');
await page.click('#close-lesson');await page.reload();await page.locator('#load-status').waitFor({state:'hidden'});await page.click('#resume');
assert.match(await page.locator('.lesson-head').innerText(),/2／3/);
await page.click('#next-question');await page.click('#next-question');
await page.screenshot({path:new URL('../artifacts/quiz.png',import.meta.url).pathname});
let raw=await page.evaluate(()=>JSON.parse(localStorage.getItem('modao-odyssey-v1-test')));let q=byId.get(raw.draft.queue[raw.draft.pos]);
const wrong=q.options.findIndex(x=>x!==q.answer);await page.click(`[data-answer="${wrong}"]`);assert.match(await page.locator('.explanation').innerText(),/先看清楚/);await page.click('#next-question');
while(await page.locator('#finish').count()===0){raw=await page.evaluate(()=>JSON.parse(localStorage.getItem('modao-odyssey-v1-test')));q=byId.get(raw.draft.queue[raw.draft.pos]);await page.click(`[data-answer="${q.options.indexOf(q.answer)}"]`);await page.click('#next-question');}
assert.match(await page.locator('.result').innerText(),/30 XP/);await page.click('#finish');await page.reload();await page.locator('#load-status').waitFor({state:'hidden'});assert.equal(await page.locator('#bag-count').innerText(),'3');
await page.click('[data-view="bag"]');assert.equal(await page.locator('.bag-item').count(),3);await page.fill('#search',bank[0].answer);assert.ok(await page.locator('.bag-item').count()>0);await page.locator('.bag-item').first().click();assert.match(await page.locator('#info-body').innerText(),/複習/);await page.click('#close-info');
await page.click('[data-view="journal"]');const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;const backupPath=new URL('../artifacts/backup.json',import.meta.url).pathname;await download.saveAs(backupPath);await page.locator('#import').setInputFiles(backupPath);await page.click('#cancel-import');await page.locator('#import').setInputFiles(backupPath);await page.click('#accept-import');assert.equal(await page.locator('.history-row').count(),1);
await page.click('[data-view="story"]');assert.equal(await page.locator('.story-card').count(),8);await page.selectOption('#companion-mobile','bear');await page.reload();await page.locator('#load-status').waitFor({state:'hidden'});assert.equal(await page.locator('#companion-mobile').inputValue(),'bear');
await page.click('[data-view="journey"]');await page.click('[data-region="5"]');assert.match(await page.locator('#map-name').innerText(),/阿里山/);assert.equal(await page.locator('#chapter-start').isDisabled(),true);
const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto('http://127.0.0.1:4198/?test=1');await mobile.locator('#load-status').waitFor({state:'hidden'});await mobile.screenshot({path:new URL('../artifacts/mobile.png',import.meta.url).pathname,fullPage:true});const overflows=[];
for(const view of ['journey','bag','journal','story']){await mobile.click(`[data-view="${view}"]`);const over=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(over)overflows.push(view);}
await mobile.click('[data-view="journey"]');await mobile.click('#hero-start');await mobile.screenshot({path:new URL('../artifacts/mobile-lesson.png',import.meta.url).pathname});assert.ok(await mobile.locator('#lesson-title').isVisible());
assert.deepEqual(overflows,[]);assert.deepEqual(errors,[]);const report={passed:true,checks:['desktop render','source questions rendered','3-item batch','wrong-answer explanation and retry','close and reload resume','atomic XP','reload persistence','bag search and detail','backup export cancel import accept','eight story locations','companion persistence','locked chapter','390px four views no overflow','mobile lesson'],consoleErrors:errors,overflows};await writeFile(new URL('../docs/browser-qa.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
