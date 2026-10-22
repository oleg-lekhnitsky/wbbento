import {chromium} from 'playwright'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(fileURLToPath(new URL('../.output/public/',import.meta.url)))
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.otf':'font/otf','.ttf':'font/ttf','.woff2':'font/woff2'}
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[],warnings=[]
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warn')warnings.push(m.text())})
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!=='http://bento.local'){await route.abort();return}const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));try{await route.fulfill({body:await readFile(file),contentType:mime[path.extname(file)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'Not found'})}})
 await page.goto('http://bento.local/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>window.wbBento)
 assert.equal(await page.locator('.preset-card').count(),8);assert.ok(await page.locator('[data-slot=button]').count()>10)
 const family=await page.locator('.studio-shell').evaluate(el=>getComputedStyle(el).fontFamily);assert.ok(family.includes('Inter'))
 await page.screenshot({path:'/tmp/wb-shadcn-desktop.png'})
 await page.getByRole('tab',{name:'Brand assets',exact:true}).click();await page.locator('.library').getByLabel('Partner name',{exact:true}).fill('NEW PARTNER');assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.partner),'NEW PARTNER')
 await page.getByRole('tab',{name:'Layouts',exact:true}).click();await page.locator('.preset-card').nth(3).click()
 await page.getByRole('tab',{name:'Canvas settings',exact:true}).click();await page.getByRole('button',{name:'Landscape',exact:false}).click();assert.ok((await page.locator('.reference-creative:not(.miniature)').getAttribute('class')).includes('landscape'))
 await page.getByRole('button',{name:'Square post',exact:false}).click();await page.locator('.artboard .photograph').click()
 await page.getByRole('button',{name:'Generate a similar driver photo',exact:true}).click();const driver=page.locator('.driver-prompt:not(.car-prompt)');await driver.getByLabel('Age',{exact:true}).fill('35');await driver.getByLabel('Nationality',{exact:true}).fill('Armenian')
 assert.ok((await driver.getByLabel('Image prompt',{exact:true}).inputValue()).includes('35-year-old'))
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text}}}))
 await driver.getByRole('button',{name:'Copy prompt',exact:true}).click();assert.ok((await page.evaluate(()=>window.copied)).includes('Armenian'))
 await page.getByRole('button',{name:'Generate a moving car photo',exact:true}).click();await page.getByRole('combobox',{name:'Street background',exact:true}).click();await page.getByRole('option',{name:'Quiet residential street',exact:true}).click();assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.carPrompt.street),'residential')
 await page.screenshot({path:'/tmp/wb-shadcn-prompts.png'})
 await page.getByRole('button',{name:'Save project',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wb-bento')).data.partner),'NEW PARTNER')
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/wb-shadcn-mobile.png',fullPage:true})
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Mobile layout has horizontal overflow')
 assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(w=>w.includes('Failed to resolve component')),[])
 console.log('Passed real shadcn controls, font, tabs, fields, formats, driver/car prompts, select menu, clipboard, save and mobile overflow')
}finally{await browser.close()}
