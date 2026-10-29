<script setup lang="ts">
import {Button as UiButton} from '~/components/ui/button'
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '~/components/ui/collapsible'
import {Download,ChevronDown,FolderDown,ExternalLink} from '@lucide/vue'
import {partnerLanguages,partnerCaption} from '~/lib/partner-languages.mjs'
import {assetZip} from '~/lib/asset-zip.mjs'
import {toPng} from 'html-to-image'
const language=ref('ru'),color=ref('dark'),busy=ref(false),status=ref(''),preview=ref<HTMLElement>()
const colors=[{value:'dark',label:'Тёмный',background:'#202020',src:'/wb-taxi-mono.svg'},{value:'purple',label:'Фиолетовый',background:'#661AFF',src:'/wb-taxi-on-purple.svg'},{value:'pink',label:'Розовый',background:'#FF00FF',src:'/wb-taxi.svg'},{value:'transparent',label:'Без фона',background:'transparent',src:'/wb-taxi-mono.svg'}]
const variant=computed(()=>colors.find(item=>item.value===color.value)||colors[0])
async function download(){
 if(!preview.value)return
 busy.value=true;status.value=''
 try{
  await document.fonts.ready
  const selectedLanguage=language.value,files=[]
  for(const item of colors){
   color.value=item.value
   await nextTick()
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
   await Promise.all(Array.from(preview.value.querySelectorAll('img')).map(image=>image.decode()))
   const url=await toPng(preview.value,{pixelRatio:4,cacheBust:false})
   const data=new Uint8Array(await (await fetch(url)).arrayBuffer())
   files.push({name:`wb-taxi-partner-${selectedLanguage}-${item.value}.png`,data})
  }
  const url=URL.createObjectURL(assetZip(files)),link=document.createElement('a')
  link.href=url;link.download=`wb-taxi-partner-${selectedLanguage}.zip`;link.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
  status.value='Скачаны все 4 цвета: тёмный, фиолетовый, розовый и без фона.'
 }catch{status.value='Не удалось скачать. Попробуйте ещё раз.'}finally{busy.value=false}
}
</script>
<template>
 <Collapsible class="driver-prompt assets-panel">
  <CollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger" data-onboarding="materials"><FolderDown class="size-4"/><span>Материалы</span><ChevronDown class="prompt-chevron size-4"/></UiButton></CollapsibleTrigger>
  <CollapsibleContent class="prompt-content">
   <a class="asset-download-action" href="https://www.figma.com/design/eImUSGdbtXvYhWAiXccZuw?node-id=27-122" target="_blank" rel="noopener noreferrer"><ExternalLink class="size-4"/><span>Материалы в Figma</span><small>Figma ↗</small></a>
   <a class="asset-download-action" href="/downloads/wb-bento-fonts.zip" download><Download class="size-4"/><span>Скачать шрифты</span><small>ZIP</small></a>
   <Collapsible class="asset-label-download">
   <CollapsibleTrigger as-child><UiButton variant="outline" class="asset-download-action"><Download class="size-4"/><span>Скачать блок партнёра</span><ChevronDown class="size-4"/></UiButton></CollapsibleTrigger>
   <CollapsibleContent class="asset-label-options">
   <p class="muted">Выберите язык, чтобы скачать все 4 цвета одним архивом.</p>
   <label>Язык<StudioSelect :disabled="busy" v-model="language" label="Язык материала" :options="partnerLanguages"/></label>
   <div class="asset-lockup-preview"><div ref="preview" class="asset-lockup" :style="{background:variant.background}"><PartnerLockup :src="variant.src" :caption="partnerCaption(language)"/></div></div>
   <UiButton :disabled="busy" @click="download"><Download class="size-4"/>{{busy?'Подготовка…':'Скачать все цвета · ZIP'}}</UiButton>
   <p role="status" aria-live="polite">{{status}}</p>
   </CollapsibleContent></Collapsible>
   <a class="asset-download-action" href="/downloads/wb-taxi-logos.zip" download><Download class="size-4"/><span>Скачать логотипы</span><small>SVG · ZIP</small></a>
  </CollapsibleContent>
 </Collapsible>
</template>
