import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}})
 await page.goto(process.env.BENTO_URL || 'http://localhost:3133')
 await page.waitForFunction(()=>window.wbBento)
 for(const layout of ['photo-bottom','photo-left'])for(const format of ['square','portrait','story','landscape']){
  await page.evaluate(async({layout,format})=>window.wbBento.create_bento({layout,format,data:{storySafeTop:280,storySafeBottom:380}}),{layout,format})
  await page.waitForTimeout(250)
  const geometry=await page.locator('.artboard .creative').evaluate(root=>{
   const rect=el=>{const r=el.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}
   return{frame:rect(root),copy:rect(root.querySelector('.headline-copy')),brand:rect(root.querySelector('.partner-brand')),lockup:rect(root.querySelector('.wb-partner'))}
  })
  const {frame,copy,brand,lockup}=geometry
  assert(copy.left>=frame.left && copy.right<=frame.right+1,`${layout}/${format}: copy horizontally inside canvas`)
  assert(copy.bottom<=lockup.top && lockup.top-copy.bottom<frame.width*.04,`${layout}/${format}: copy directly above lockup`)
  assert(brand.bottom<copy.top,`${layout}/${format}: brand precedes copy`)
  assert(lockup.bottom<=frame.bottom+1,`${layout}/${format}: lockup inside canvas`)
  if(format==='story'){
   assert(brand.top>=frame.top+frame.height*280/1920-1,'brand clears top safe area')
   assert(lockup.bottom<=frame.bottom-frame.height*380/1920+1,'lockup clears bottom safe area')
  }
 }
 console.log('Photo layouts: both templates pass all four formats, including custom story safe areas.')
}finally{await browser.close()}
