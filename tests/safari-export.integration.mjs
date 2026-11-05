import assert from 'node:assert/strict'
import {webkit} from 'playwright'

const browser=await webkit.launch({headless:true})
try{
 const context=await browser.newContext({viewport:{width:1600,height:1300}})
 const url=process.env.BENTO_URL||'http://127.0.0.1:3133'
 await context.addCookies([{name:'wb-bento-onboarding-v1',value:'seen',url}])
 const page=await context.newPage()
 await page.goto(url,{waitUntil:'networkidle'})
 await page.waitForFunction(()=>window.wbBento)
 for(const format of ['square','portrait','landscape','widescreen']){
  await page.evaluate(format=>window.wbBento.create_bento({layout:'photo-payments',format}),format)
  const result=await page.evaluate(async()=>{
   const root=document.querySelector('.artboard')
   const png=await window.wbBento.render_bento()
   const image=new Image();image.src=png;await image.decode()
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
   const base=root.getBoundingClientRect()
   function count(selector,predicate,topPart=1){
    const r=root.querySelector(selector).getBoundingClientRect()
    const x=Math.max(0,Math.round((r.x-base.x)/base.width*canvas.width))
    const y=Math.max(0,Math.round((r.y-base.y)/base.height*canvas.height))
    const w=Math.min(canvas.width-x,Math.round(r.width/base.width*canvas.width))
    const h=Math.min(canvas.height-y,Math.round(r.height/base.height*canvas.height*topPart))
    const pixels=ctx.getImageData(x,y,w,h).data
    let matched=0
    for(let i=0;i<pixels.length;i+=4)if(predicate(pixels[i],pixels[i+1],pixels[i+2]))matched++
    return matched/(w*h)
   }
   return {width:canvas.width,height:canvas.height,
    photo:count('.photograph',(r,g,b)=>Math.max(r,g,b)-Math.min(r,g,b)>25,.5),
    text:count('.benefit h3',(r,g,b)=>r>225&&g>225&&b>225)}
  })
  assert.ok(result.photo>.1,`${format}: photo pixels missing (${result.photo})`)
  assert.ok(result.text>.02,`${format}: text pixels missing (${result.text})`)
  console.log(`WebKit ${format}: photo and text present in ${result.width}×${result.height} PNG`)
 }
}finally{await browser.close()}
