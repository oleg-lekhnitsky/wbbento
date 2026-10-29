import {chromium} from 'playwright'
import assert from 'node:assert/strict'

const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}})
 await page.context().addCookies([{name:'wb-bento-onboarding-v1',value:'completed',url:process.env.STUDIO_URL || 'http://localhost:3000'}])
 await page.goto(process.env.STUDIO_URL || 'http://localhost:3000',{waitUntil:'networkidle'})
 await page.waitForFunction(()=>window.wbBento)
 await page.evaluate(()=>window.wbBento.create_bento({layout:11,format:0}))
 for(const group of ['Готовые фото водителя','Готовые фото автомобиля']){
  await page.locator('.block-picker').getByRole('button',{name:'Фото',exact:true}).click()
  const trigger=page.getByRole('button',{name:group,exact:true})
  if(await trigger.getAttribute('data-state')!=='open')await trigger.click()
  await page.getByRole('group',{name:group,exact:true}).getByRole('button').first().click()
  const image=await page.evaluate(()=>window.wbBento.get_bento().data.image)
  await page.evaluate(()=>window.wbBento.update_bento({data:{position:68,positionY:74,photoZoom:125}}))
  for(const ratio of ['4:5','9:16','1.91:1','16:9','1:1']){
   await page.locator('.format-grid').getByText(ratio,{exact:true}).click()
   assert.equal(await page.evaluate(()=>window.wbBento.get_bento().data.image),image,`${group}: photo changed in ${ratio}`)
  }
  const data=await page.evaluate(()=>window.wbBento.get_bento().data)
  assert.equal(data.position,68);assert.equal(data.positionY,74);assert.equal(data.photoZoom,125)
 }
 console.log('Ready driver and car photos persist across all five formats; original crop restored without saving defaults.')
}finally{await browser.close()}
