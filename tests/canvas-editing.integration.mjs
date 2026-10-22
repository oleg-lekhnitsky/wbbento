import {chromium} from 'playwright'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(fileURLToPath(new URL('../.output/public/',import.meta.url)))
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.otf':'font/otf','.ttf':'font/ttf'}
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.route('http://bento.local/**',async route=>{const url=new URL(route.request().url()),target=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));try{await route.fulfill({body:await readFile(target),contentType:mime[path.extname(target)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'Not found'})}})
 await page.goto('http://bento.local/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.wbBento)
 await page.evaluate(()=>window.wbBento.create_bento({layout:'start-today',data:{heading:'подключаем в Ташкенте с wb taxi',description:'каждый день',benefitLabels:'физ лица\nип',city:'Ташкент\nСамарканд'}}))
 async function replace(selector,text){
  const field=page.locator(selector);await field.click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('Backspace')
  assert.equal(await field.count(),1,'Field removed before replacement could be typed')
  await page.keyboard.insertText(text);assert.ok((await field.innerText()).length>0,'Text disappeared while typing')
  await page.locator('.below-canvas').click();return field
 }
 const heading=await replace('.artboard .headline h2','работайте с wb taxi в Ташкенте')
 for(const text of ['снова с wb taxi в Ташкенте','новый график для водителей','աշխատեք wb taxi-ի հետ'])await replace('.artboard .headline h2',text)
 assert.ok((await heading.innerText()).includes('աշխատեք'))
 await replace('.artboard .headline p','новый подзаголовок')
 assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.description),'новый подзаголовок')
 await replace('.artboard [data-transform-key="label-0"] .chip-text','комфорт')
 assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.benefitLabels),'комфорт\nип')
 await replace('.artboard [data-transform-key="photo-city-0"] .chip-text','Ереван')
 assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.city),'Ереван\nСамарканд')
 await replace('.artboard [data-transform-key="phone"]','+374 99 123456')
 await heading.click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText('cancelled change');await page.keyboard.press('Escape')
 assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.heading),'աշխատեք wb taxi-ի հետ')
 // Composition events must not replace the DOM or commit an unfinished input.
 await heading.click();await heading.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));el.textContent='նոր աշխատանք';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}))})
 assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.heading),'աշխատեք wb taxi-ի հետ')
 await heading.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'նոր աշխատանք'})))
 await page.locator('.below-canvas').click();assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.heading),'նոր աշխատանք')
 await page.getByRole('button',{name:'Save project',exact:true}).click();await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.wbBento)
 assert.equal(await page.locator('.artboard .headline h2').innerText(),'նոր աշխատանք')
 assert.equal(await page.locator('.artboard .headline p').innerText(),'новый подзаголовок')
 await page.evaluate(()=>window.wbBento.update_bento({data:{heading:'работайте в Гюмри и Санкт-Петербурге',description:'աշխատանք Գյումրիում',benefit:'drive in New York',city:'Երևան'}}))
 assert.equal(await page.locator('.artboard .headline h2').innerText(),'работайте в Гюмри и Санкт-Петербурге')
 assert.equal(await page.locator('.artboard .headline p').innerText(),'աշխատանք Գյումրիում')
 assert.equal(await page.locator('.artboard .benefit h3').innerText(),'drive in New York')
 assert.deepEqual(errors,[])
 console.log('Passed repeated rich-text edits, clear-and-replace subtitles/chips, city/contact edits, Escape, IME composition and save/reload')
}finally{await browser.close()}
