import {spawn} from 'node:child_process'
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import path from 'node:path'
const origin='http://127.0.0.1:3125'
const child=spawn(process.execPath,['.output/server/index.mjs'],{env:{...process.env,PORT:'3125',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']})
let log='',browser;for(const stream of [child.stdout,child.stderr])stream.on('data',c=>log+=c)
try{
 let ready=false
 for(let i=0;i<80;i++){try{if((await fetch(origin)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}
 assert.ok(ready,log)
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(origin,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.wbBento)
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copiedBrief=text}}))
 await page.getByRole('button',{name:'ChatGPT',exact:true}).click()
 const flow=page.locator('.chatgpt-exchange')
 assert.equal(await page.locator('.inspector .chatgpt-exchange').count(),0)
 await page.getByRole('tab',{name:'Canvas settings',exact:true}).click()
 await page.getByRole('tab',{name:'Block settings',exact:true}).click()
 assert.equal(await flow.getByLabel('Anything else? · optional',{exact:true}).isVisible(),true)
 await flow.getByLabel('Anything else? · optional',{exact:true}).fill('Recruit drivers in Երևան')
 await flow.getByRole('button',{name:'Continue to ChatGPT',exact:true}).click()
 await flow.getByRole('combobox',{name:'New photo',exact:true}).click();await page.getByRole('option',{name:'Generate a driver photo',exact:true}).click()
 await flow.getByLabel('Age',{exact:true}).fill('42');await flow.getByLabel('Nationality',{exact:true}).fill('Armenian')
 await flow.getByRole('button',{name:'Copy for ChatGPT',exact:true}).click()
 await page.waitForFunction(()=>window.copiedBrief?.includes('42-year-old'))
 assert.ok((await page.evaluate(()=>window.copiedBrief)).includes('Recruit drivers in Երևան'))
 await flow.getByRole('button',{name:'I have the result',exact:true}).click()
 const project=await page.evaluate(()=>window.wbBento.get_bento());project.data.heading='նոր առաջարկ Երևանում'
 await flow.getByLabel('ChatGPT result JSON',{exact:true}).fill('```json\n'+JSON.stringify({project,images:[{slot:'photo',filename:'new-driver.png'}]})+'\n```')
 await flow.getByRole('button',{name:'Import JSON',exact:true}).click()
 assert.equal(await flow.getByRole('button',{name:'Apply result to canvas',exact:true}).isEnabled(),false)
 await flow.locator('.exchange-image-slot input[type=file]').setInputFiles(path.resolve('public/assets/figma/driver-blue.png'))
 await flow.getByRole('button',{name:'Apply result to canvas',exact:true}).click()
 await page.waitForFunction(()=>window.wbBento.get_bento().data.heading==='նոր առաջարկ Երևանում')
 assert.ok((await page.evaluate(()=>window.wbBento.get_bento().data.image)).startsWith('data:image/png;base64,'))
 await flow.getByLabel('ChatGPT result JSON',{exact:true}).fill('{bad json')
 await flow.getByRole('button',{name:'Import JSON',exact:true}).click();assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.heading),'նոր առաջարկ Երևանում')
 await page.screenshot({path:'/tmp/wb-chatgpt-exchange.png'})
 assert.deepEqual(errors,[])
 console.log('Passed brief clipboard, age/nationality prompts, fenced JSON review, missing-image guard, actual image upload, atomic apply, and invalid JSON preservation')
}finally{await browser?.close();child.kill('SIGTERM')}
