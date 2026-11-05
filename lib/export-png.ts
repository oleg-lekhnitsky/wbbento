import {toPng,toSvg} from 'html-to-image'
import type {Options} from 'html-to-image/lib/types'

const svgNamespace='http://www.w3.org/2000/svg'
const nextPaint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))

/** WebKit drops some HTML image layers when painting an SVG foreignObject. */
export async function exportBannerPng(node:HTMLElement,options:Options){
 const webkit=/AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR)/.test(navigator.userAgent)
 if(!webkit)return toPng(node,options)
 const sources=Array.from(node.querySelectorAll('img'))
 const snapshot=await toSvg(node,options)
 const documentSnapshot=new DOMParser().parseFromString(decodeURIComponent(snapshot.slice(snapshot.indexOf(',')+1)),'image/svg+xml')
 const images=Array.from(documentSnapshot.querySelectorAll('img'))
 for(const [index,image] of images.entries()){
  const source=sources[index]
  if(!source?.naturalWidth)continue
  const style=getComputedStyle(source)
  const width=parseFloat(style.width)||source.clientWidth
  const height=parseFloat(style.height)||source.clientHeight
  if(!width || !height)continue
  const svg=documentSnapshot.createElementNS(svgNamespace,'svg')
  svg.setAttribute('style',image.getAttribute('style')||'')
  svg.setAttribute('width',String(width));svg.setAttribute('height',String(height))
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`)
  svg.style.overflow='hidden'
  const picture=documentSnapshot.createElementNS(svgNamespace,'image')
  const fit=style.objectFit
  const scale=fit==='cover'?Math.max(width/source.naturalWidth,height/source.naturalHeight):fit==='contain'?Math.min(width/source.naturalWidth,height/source.naturalHeight):fit==='scale-down'?Math.min(1,width/source.naturalWidth,height/source.naturalHeight):1
  const drawnWidth=fit==='fill'?width:source.naturalWidth*scale
  const drawnHeight=fit==='fill'?height:source.naturalHeight*scale
  const position=style.objectPosition.split(' ')
  const offset=(value:string|undefined,space:number)=>value?.endsWith('%')?space*parseFloat(value)/100:parseFloat(value||'0')||0
  picture.setAttribute('x',String(offset(position[0],width-drawnWidth)))
  picture.setAttribute('y',String(offset(position[1],height-drawnHeight)))
  picture.setAttribute('width',String(drawnWidth));picture.setAttribute('height',String(drawnHeight))
  picture.setAttribute('preserveAspectRatio','none')
  picture.setAttribute('href',image.getAttribute('src')||'')
  svg.appendChild(picture);image.replaceWith(svg)
 }
 const image=new Image()
 image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(documentSnapshot))
 await image.decode()
 // Give embedded fonts and image layers a paint before reading the canvas.
 await nextPaint();await nextPaint()
 const canvas=document.createElement('canvas')
 canvas.width=options.canvasWidth||image.naturalWidth;canvas.height=options.canvasHeight||image.naturalHeight
 const context=canvas.getContext('2d')
 if(!context)throw new Error('Не удалось создать изображение баннера')
 context.drawImage(image,0,0,canvas.width,canvas.height)
 await nextPaint()
 context.clearRect(0,0,canvas.width,canvas.height)
 context.drawImage(image,0,0,canvas.width,canvas.height)
 return canvas.toDataURL('image/png')
}
