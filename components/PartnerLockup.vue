<script setup lang="ts">
const props=defineProps<{src:string; photo?:boolean;caption?:string}>()
const logoWidth=computed(()=>props.photo?'56.91%':'53.65%')
const gap=computed(()=>props.photo?'5.778%':'7.996%')
const captionSize=computed(()=>props.photo?'5.615cqw':'5.293cqw')
const captionFont="'WB Armenian',WB,Arial,sans-serif"
const root=ref<HTMLElement>(),captionNode=ref<HTMLElement>()
let observer:ResizeObserver|undefined,frame=0,disposed=false
function fitCaption(){
 const el=captionNode.value;if(!el)return
 el.style.fontSize=captionSize.value
 if(el.clientWidth && el.scrollWidth>el.clientWidth)el.style.fontSize=parseFloat(getComputedStyle(el).fontSize)*el.clientWidth/el.scrollWidth+'px'
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(fitCaption)}
onMounted(()=>{observer=new ResizeObserver(schedule);if(root.value)observer.observe(root.value);schedule();document.fonts.ready.then(()=>{if(!disposed)schedule()})})
watch(()=>[props.caption,props.photo],()=>nextTick(schedule))
onBeforeUnmount(()=>{disposed=true;observer?.disconnect();cancelAnimationFrame(frame)})
</script>
<template>
 <div ref="root" class="partner-lockup" style="container-type:inline-size;width:100%;min-width:0">
  <div :style="{display:'flex',alignItems:'center',gap,width:'100%'}">
   <img :src="src" alt="WB Taxi" :style="{display:'block',width:logoWidth,height:'auto',maxWidth:'none',flex:'0 0 '+logoWidth,objectFit:'contain',objectPosition:'left center'}"/>
   <span ref="captionNode" :style="{minWidth:0,flex:1,display:'block',fontFamily:captionFont,fontSize:captionSize,lineHeight:.98,whiteSpace:'pre',fontWeight:400}">{{caption===undefined?'официальный\nпартнер':caption}}</span>
  </div>
 </div>
</template>
