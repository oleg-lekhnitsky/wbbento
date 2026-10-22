import type { Ref } from 'vue'
export interface ElementTransform { x:number; y:number; scale:number; rotation:number }
export interface CanvasGuide { axis:'x'|'y'; position:number }
const identity=():ElementTransform=>({x:0,y:0,scale:1,rotation:0})
export function useCanvasElements(root:Ref<HTMLElement|undefined>, options:{
 scope:()=>string; format:()=>{w:number;h:number}; values:()=>Record<string,Record<string,ElementTransform>>|undefined;
 enabled:()=>boolean; update:(key:string,value:ElementTransform)=>void; select:(block:string)=>void;
}){
 const active=ref(''), box=ref<{left:number;top:number;width:number;height:number}>(), guides=ref<CanvasGuide[]>([])
 let observer:ResizeObserver|undefined, frame=0
 let gesture:{pointer:number;mode:string;key:string;start:ElementTransform;startX:number;startY:number;rect:DOMRect;centerX:number;centerY:number;distance:number;angle:number;capture:HTMLElement}|undefined
 const transformable=(key:string)=>['photo','artwork','vehicle'].includes(key)
 const get=(key:string):ElementTransform=>({...identity(),...options.values()?.[options.scope()]?.[key]})
 const style=(key:string)=>{
  if(!transformable(key))return {}
  const value=get(key), width=options.format().w-80
  return {transform:`translate(${value.x/width*100}cqw, ${value.y/width*100}cqw) rotate(${value.rotation}deg) scale(${value.scale})`,transformOrigin:key==='artwork'?'var(--artwork-transform-origin, center center)':'center center'}
 }
 function node(key=active.value){return Array.from(root.value?.querySelectorAll<HTMLElement>('[data-transform-key]') || []).find(el=>el.dataset.transformKey===key)}
 function measure(){
  const el=node(),canvas=root.value
  if(!el || !canvas || !el.getClientRects().length){box.value=undefined;return}
  const bounds=el.getBoundingClientRect(),base=canvas.getBoundingClientRect()
  box.value={left:bounds.left-base.left,top:bounds.top-base.top,width:bounds.width,height:bounds.height}
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
 function select(key:string){active.value=key;const el=node(key);if(el?.dataset.editorBlock)options.select(el.dataset.editorBlock);schedule()}
 function targets(el:HTMLElement){
  const result:{axis:'x'|'y';position:number}[]=[]
  const canvas=root.value!,base=canvas.getBoundingClientRect(),parent=(el.closest('.tile') || el.closest('.creative-footer') || canvas) as HTMLElement
  const bounds=parent.getBoundingClientRect(),pad=getComputedStyle(parent)
  const left=bounds.left+parseFloat(pad.paddingLeft||'0'),right=bounds.right-parseFloat(pad.paddingRight||'0')
  const top=bounds.top+parseFloat(pad.paddingTop||'0'),bottom=bounds.bottom-parseFloat(pad.paddingBottom||'0')
  result.push({axis:'x',position:left},{axis:'x',position:(bounds.left+bounds.right)/2},{axis:'x',position:right},{axis:'y',position:top},{axis:'y',position:(bounds.top+bounds.bottom)/2},{axis:'y',position:bottom})
  // Other cards and objects provide alignment edges and center lines.
  for(const sibling of canvas.querySelectorAll<HTMLElement>('.tile,[data-transform-key]')){
   if(sibling===el || sibling.contains(el) || el.contains(sibling) || !sibling.getClientRects().length)continue
   const r=sibling.getBoundingClientRect();if(!r.width || !r.height)continue
   result.push({axis:'x',position:r.left},{axis:'x',position:(r.left+r.right)/2},{axis:'x',position:r.right},{axis:'y',position:r.top},{axis:'y',position:(r.top+r.bottom)/2},{axis:'y',position:r.bottom})
  }
  return {result,base}
 }
 function snap(el:HTMLElement,rect:DOMRect,dx:number,dy:number,disabled:boolean){
  if(disabled){guides.value=[];return {dx,dy}}
  const {result,base}=targets(el),found:CanvasGuide[]=[]
  for(const axis of ['x','y'] as const){
   const positions=axis==='x'?[rect.left+dx,(rect.left+rect.right)/2+dx,rect.right+dx]:[rect.top+dy,(rect.top+rect.bottom)/2+dy,rect.bottom+dy]
   let closest=5,delta=0,target:number|undefined
   for(const candidate of result.filter(item=>item.axis===axis))for(const position of positions){const distance=Math.abs(candidate.position-position);if(distance<closest){closest=distance;delta=candidate.position-position;target=candidate.position}}
   if(target!==undefined){if(axis==='x')dx+=delta;else dy+=delta;found.push({axis,position:target-(axis==='x'?base.left:base.top)})}
  }
  guides.value=found;return {dx,dy}
 }
 function start(event:PointerEvent,mode='move',key=active.value){
  const el=node(key)
  if(!options.enabled() || event.button!==0 || !el || !transformable(key))return
  select(key)
  root.value?.focus({preventScroll:true})
  const rect=el.getBoundingClientRect(),centerX=(rect.left+rect.right)/2,centerY=(rect.top+rect.bottom)/2
  const capture=event.currentTarget as HTMLElement
  gesture={pointer:event.pointerId,mode,key,start:get(key),startX:event.clientX,startY:event.clientY,rect,centerX,centerY,distance:Math.max(1,Math.hypot(event.clientX-centerX,event.clientY-centerY)),angle:Math.atan2(event.clientY-centerY,event.clientX-centerX),capture}
  capture.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation()
 }
 function down(event:PointerEvent){
  if(!options.enabled() || (event.target as Element).closest('[data-editor-control]'))return
  const el=(event.target as Element).closest<HTMLElement>('[data-transform-key]')
  if(!el || !root.value?.contains(el)){active.value='';guides.value=[];return}
  const key=el.dataset.transformKey!
  if(!transformable(key)){active.value='';guides.value=[];if(el.dataset.editorBlock)options.select(el.dataset.editorBlock);return}
  select(key)
  if((event.target as Element).closest('[contenteditable="plaintext-only"],[contenteditable="true"]'))return
  // Photo panning retains its bounded crop behavior; handles transform its image.
  if(!transformable(key))return
  if(key==='photo'){root.value?.focus({preventScroll:true});return}
  start(event,'move',key)
 }
 function move(event:PointerEvent){
  if(!gesture || event.pointerId!==gesture.pointer)return
  const g=gesture,el=node(g.key);if(!el || !root.value)return
  const next={...g.start},ratio=root.value.getBoundingClientRect().width/options.format().w
  if(g.mode==='move'){
   const delta=snap(el,g.rect,event.clientX-g.startX,event.clientY-g.startY,event.altKey)
   next.x+=delta.dx/ratio;next.y+=delta.dy/ratio
  }else if(g.mode==='scale'){
   next.scale=Math.max(.1,Math.min(6,g.start.scale*Math.hypot(event.clientX-g.centerX,event.clientY-g.centerY)/g.distance))
  }else{
   const degrees=(Math.atan2(event.clientY-g.centerY,event.clientX-g.centerX)-g.angle)*180/Math.PI+g.start.rotation
   const step=event.shiftKey?15:90,nearest=Math.round(degrees/step)*step
   next.rotation=Math.abs(degrees-nearest)<4 || event.shiftKey?nearest:Math.round(degrees*10)/10
  }
  options.update(g.key,next);nextTick(schedule)
 }
 function end(event?:PointerEvent){
  if(!gesture || event && event.pointerId!==gesture.pointer)return
  const g=gesture;gesture=undefined;guides.value=[]
  if(g.capture.hasPointerCapture(g.pointer))g.capture.releasePointerCapture(g.pointer)
  schedule()
 }
 function reset(){if(active.value)options.update(active.value,identity());nextTick(schedule)}
 function keydown(event:KeyboardEvent){
  if((event.target as Element).closest('[contenteditable="plaintext-only"],[contenteditable="true"],input,textarea'))return
  if(event.key==='Escape'){
   if(gesture)options.update(gesture.key,gesture.start)
   end();active.value='';guides.value=[];return
  }
  if(!active.value || !transformable(active.value) || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
  const value=get(active.value),amount=event.shiftKey?10:1
  value.x+=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0
  value.y+=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0
  event.preventDefault();options.update(active.value,value);nextTick(schedule)
 }
 watch(options.scope,()=>{end();active.value='';box.value=undefined;guides.value=[]})
 watch(options.values,schedule,{deep:true,flush:'post'})
 onMounted(()=>{observer=new ResizeObserver(schedule);if(root.value)observer.observe(root.value);window.addEventListener('resize',schedule);document.fonts.ready.then(schedule)})
 onBeforeUnmount(()=>{end();observer?.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule)})
 return {active,box,guides,get,style,select,down,start,move,end,keydown,reset,measure,schedule}
}
