import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { validateProject } from './bento-project.mjs'
const root=path.resolve(fileURLToPath(new URL('../.output/public/',import.meta.url)))
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.otf':'font/otf','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp'}
export async function renderProject(project){
 const validated=validateProject(project)
 try{await readFile(path.join(root,'index.html'))}catch{throw new Error('Build the renderer first: npm run generate')}
 const browser=await chromium.launch({headless:true})
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1300},deviceScaleFactor:1,serviceWorkers:'block'})
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url())
   if(url.origin!=='http://bento.local'){await route.abort();return}
   const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname)
   const target=path.resolve(root,'.'+pathname)
   if(!target.startsWith(root+path.sep)){await route.fulfill({status:403,body:'Forbidden'});return}
   try{await route.fulfill({body:await readFile(target),contentType:types[path.extname(target)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'Not found'})}
  })
  await page.goto('http://bento.local/',{waitUntil:'networkidle'})
  await page.waitForFunction(()=>Boolean(window.wbBento))
  const url=await page.evaluate(async project=>{await window.wbBento.open_bento(project);return await window.wbBento.render_bento()},validated)
  if(!url.startsWith('data:image/png;base64,'))throw new Error('Renderer returned an invalid image')
  return Buffer.from(url.split(',')[1],'base64')
 }finally{await browser.close()}
}
