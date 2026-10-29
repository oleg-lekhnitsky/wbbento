<script setup lang="ts">
import { Collapsible as UiCollapsible, CollapsibleTrigger as UiCollapsibleTrigger, CollapsibleContent as UiCollapsibleContent } from '~/components/ui/collapsible'
import { ChevronDown, Images } from '@lucide/vue'
import {carStreets,driverPhotoStyles} from '~/lib/image-prompts.mjs'
import {framingScope,captureFraming,applyFraming,applyTemplateFraming,templateDefaultsFromFramings} from '~/lib/framing-defaults.mjs'
import framingPresets from '~/lib/framing-presets.json'
import {uiName} from '~/lib/ui-ru.mjs'
import {partnerLanguages,partnerLanguage,partnerCaption} from '~/lib/partner-languages.mjs'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '~/components/ui/resizable'
import { useMediaQuery } from '@vueuse/core'
import { Button as UiButton } from '~/components/ui/button'
import { Input as UiInput } from '~/components/ui/input'
import { Textarea as UiTextarea } from '~/components/ui/textarea'
import { Tabs as UiTabs, TabsList as UiTabsList, TabsTrigger as UiTabsTrigger, TabsContent as UiTabsContent } from '~/components/ui/tabs'
import { Badge as UiBadge } from '~/components/ui/badge'
import { Separator as UiSeparator } from '~/components/ui/separator'
import { ToggleGroup as UiToggleGroup, ToggleGroupItem as UiToggleGroupItem } from '~/components/ui/toggle-group'
import { Slider as UiSlider } from '~/components/ui/slider'
import { Switch as UiSwitch } from '~/components/ui/switch'
import { Download, Save, Plus, Minus, Layers2, Settings2, Upload, Check, MousePointer2, LoaderCircle, Sparkles, ShieldCheck, Code2, CircleHelp } from '@lucide/vue'
import { toPng } from 'html-to-image'
import {parseChatGptResult} from '~/lib/chatgpt-exchange.mjs'
import { normalizeVehicleAsset, defaults, formats, presets, presetCopy, presetAssets, presetStyles, createProject, updateProject, validateProject, listLayouts, assetPlacementReset } from '~/lib/bento-project.mjs'

const templateGroups=[{name:'На весь кадр',indices:presets.map((_,i)=>i).filter(i=>i>=8)},{name:'Бенто',indices:presets.map((_,i)=>i).filter(i=>i<8)}]
const compactWorkspace=useMediaQuery('(max-width: 850px)')
const previewCanvas=ref<{fitText:()=>void}>()
const initialProject=createProject({layout:templateGroups[0].indices[0],format:0})
const data=reactive(initialProject.data)
const partnerCaptionLanguage=computed({get:()=>partnerLanguage(data.partnerCaption).value,set:(value:string)=>{data.partnerCaption=partnerCaption(value)}})
watch(()=>data.partnerCaption,caption=>{const fixed=partnerLanguage(caption).caption;if(caption!==fixed)data.partnerCaption=fixed},{immediate:true,flush:'sync'})
const labelText=computed({get:()=>data.benefitLabels ?? [data.benefitLabel1,data.benefitLabel2].filter(Boolean).join('\n'),set:(value:string)=>{data.benefitLabels=value}})
watch(()=>[data.heading,data.description,data.benefit,data.partner,data.city,data.website],()=>{
 for(const key of ['heading','description','benefit','partner','city','website'] as const){
  const normalized=data[key].replace(/(?<![\p{L}\p{N}_])wb(?![\p{L}\p{N}_])/giu,'wb')
  if(data[key]!==normalized)data[key]=normalized
 }
},{immediate:true})
const selectedBlockName=computed(()=>({headline:'Заголовок',benefit:'Преимущество',image:'Фото',vehicle:'Автомобиль',partner:'Официальный партнёр',contacts:'Контакты',format:'Формат'}[selected.value] || ''))
function setBlockStyle(style:string){if(!['headline','benefit','image','vehicle','partner'].includes(selected.value))return;data.blockStyles={...data.blockStyles,[selected.value]:style}}
const preset=ref(initialProject.preset), selected=ref('headline'), zoom=ref(75), exporting=ref(false), toast=ref(''), artboard=ref<HTMLElement>(), ready=ref(false)

const formatIndex=ref(0),format=computed(()=>formats[formatIndex.value])
const isDevelopment=import.meta.dev
const templateDefaults=templateDefaultsFromFramings(framingPresets,presetAssets)
const savedPresetStyles=ref<Record<string,Record<string,string>>>(templateDefaults.styles)
const savedPresetPhotos=ref<Record<string,string>>(templateDefaults.photos)
const draftPresetPhotos=ref<Record<string,string>>({})
const framingDrafts=ref<Record<string,any>>({}),savedFramings=ref<Record<string,any>>(structuredClone(framingPresets))
function rememberFraming(){if(ready.value){const scope=framingScope(preset.value,format.value);framingDrafts.value[scope]=captureFraming(data,scope);draftPresetPhotos.value[preset.value]=data.image}}
function restoreFraming(){const scope=framingScope(preset.value,format.value);applyTemplateFraming(data,scope,framingDrafts.value[scope] || savedFramings.value[scope],draftPresetPhotos.value[preset.value] ?? savedPresetPhotos.value[preset.value],savedPresetStyles.value[preset.value])}
function templatePreview(index:number){
 if(index===preset.value)return data
 const preview=createProject({layout:index,format:formatIndex.value}).data
 const scope=framingScope(index,format.value)
 applyTemplateFraming(preview,scope,framingDrafts.value[scope] || savedFramings.value[scope],draftPresetPhotos.value[index] ?? savedPresetPhotos.value[index],savedPresetStyles.value[index])
 return preview
}
function changeFormat(index:number){
 if(index===formatIndex.value)return
 rememberFraming();formatIndex.value=index
 const base=createProject({layout:preset.value,format:index}).data
 const scope=framingScope(preset.value,format.value),framing=captureFraming(base,scope)
 for(const key of ['image','artwork','vehicleImage'] as const)framing[key]=data[key]
 framing.blockStyles={...data.blockStyles}
 framing.transforms=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(data.elementTransforms?.[scope] || {}).filter(([key])=>['photo','artwork','vehicle'].includes(key)))))
 applyFraming(data,scope,framing)
 restoreFraming()
}
function saveAllFramingDefaults(){
 if(!isDevelopment)return
 rememberFraming()
 try{const all={...savedFramings.value,...framingDrafts.value};const photos={...savedPresetPhotos.value,...draftPresetPhotos.value,[preset.value]:data.image};const styles={...savedPresetStyles.value,[preset.value]:{...data.blockStyles}};localStorage.setItem('wb-bento-preset-styles',JSON.stringify(styles));localStorage.setItem('wb-bento-preset-photos',JSON.stringify(photos));localStorage.setItem('wb-bento-framing-defaults',JSON.stringify(all));savedPresetStyles.value=styles;savedPresetPhotos.value=photos;savedFramings.value=JSON.parse(JSON.stringify(all));notify('Фото и цвета блоков назначены шаблону; кадрирование сохранено по форматам')}
 catch(error){notify(error instanceof DOMException && error.name==='QuotaExceededError'?'Не удалось сохранить: недостаточно места. Экспортируйте настройки кадрирования в JSON.':'Не удалось сохранить настройки кадрирования. Экспортируйте их в JSON.')}
}
function exportFramingDefaults(){
 if(!isDevelopment)return
 rememberFraming();const all={...savedFramings.value,...framingDrafts.value}
 for(let index=0;index<presets.length;index++)for(let fi=0;fi<formats.length;fi++){
  const scope=framingScope(index,formats[fi]),preview=createProject({layout:index,format:fi}).data
  const photo=index===preset.value?data.image:draftPresetPhotos.value[index] ?? savedPresetPhotos.value[index]
  const styles=index===preset.value?data.blockStyles:savedPresetStyles.value[index]
  applyTemplateFraming(preview,scope,all[scope],photo,styles);all[scope]=captureFraming(preview,scope)
 }
 const content=JSON.stringify(all,null,2)
 const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='framing-defaults.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
onMounted(()=>{if(!isDevelopment)return;try{savedPresetStyles.value={...templateDefaults.styles,...JSON.parse(localStorage.getItem('wb-bento-preset-styles') || '{}')};savedPresetPhotos.value={...templateDefaults.photos,...JSON.parse(localStorage.getItem('wb-bento-preset-photos') || '{}')};savedFramings.value={...structuredClone(framingPresets),...JSON.parse(localStorage.getItem('wb-bento-framing-defaults') || '{}')};for(const index of [11,12]){const previous=index===11?'/assets/driver-scenes/uzbek-35-low-angle.png':'/assets/car-scenes/concrete-wall-front-left-v5.png';if(savedPresetPhotos.value[index]===previous)savedPresetPhotos.value[index]=templateDefaults.photos[index]}restoreFraming()}catch{}})
const showSafeGuides=ref(true)
const settingsTab=ref('Block')
const visibleBlocks=computed(()=>{
 const keys=preset.value>=8 || preset.value===0?['headline','image','partner']:preset.value===5?['image','benefit','partner']:format.value.w/format.value.h>1.5?['headline','benefit',...([1,6,7].includes(preset.value)?['vehicle']:['image']),'partner']
 :preset.value===0?['headline','image','partner']:preset.value===5?['image','benefit','partner']:[1,6,7].includes(preset.value)?['headline','benefit','vehicle','partner']:['headline','benefit','image','partner']
 const names:Record<string,string>={headline:'Заголовок',benefit:'Преимущество',image:'Фото',vehicle:'Автомобиль',partner:'Официальный партнёр',contacts:'Контакты',format:'Формат'}
 return [...keys,'contacts'].map(key=>({key,name:names[key]}))
})
function updateCopy(change:{key:string;value:string;index?:number}){
 if(change.key==='label' && change.index!==undefined){const labels=labelText.value.split('\n').map(label=>label.trim()).filter(Boolean);labels[change.index]=change.value.replace(/\n/g,' ');labelText.value=labels.filter(Boolean).join('\n');return}
 if(change.key==='city' && change.index!==undefined){const cities=[...new Set(data.city.split(/[\n,;]+/).map(city=>city.trim()).filter(Boolean))];cities[change.index]=change.value.replace(/[\n,;]+/g,' ').trim();data.city=cities.filter(Boolean).join('\n');return}
 if(['heading','description','benefit','website','phone','benefitLabel1','benefitLabel2'].includes(change.key))(data as any)[change.key]=change.value
}
function updateElement(change:{scope:string;key:string;value:any}){data.elementTransforms={...data.elementTransforms,[change.scope]:{...data.elementTransforms?.[change.scope],[change.key]:change.value}}}

function clearCanvasSelection(event:PointerEvent){
 const target=event.target as Element
 if(target.closest('.artboard,[data-editor-control],button,input,textarea,select,a'))return
 selected.value='';settingsTab.value='Canvas'
 if(document.activeElement instanceof HTMLElement)document.activeElement.blur()
}
function selectBlock(key:string){selected.value=key;settingsTab.value=key==='canvas'?'Canvas':'Block'}
watch(visibleBlocks,blocks=>{if(selected.value && !blocks.some(block=>block.key===selected.value))selected.value=blocks[0].key})

function applyPresetAssets(index:number){Object.assign(data,presetAssets[index],{vehicleScale:200,vehiclePosition:190})}

function choosePreset(index:number){if(index===preset.value)return;rememberFraming();preset.value=index;applyPresetAssets(index);data.blockStyles=presetStyles(index);data.benefitLabels=undefined;data.benefitLabel1=index===1?'комфорт':'физ лица';data.benefitLabel2=index===1?'электро':'ип';[data.heading,data.description,data.benefit]=presetCopy[index];restoreFraming()}

function notify(message:string){toast.value=message;setTimeout(()=>toast.value='',3500)}
function resetPhotoCrop(){
 const scope=framingScope(preset.value,format.value),saved=savedFramings.value[scope]
 if(saved && saved.image===data.image){
  for(const key of ['position','positionY','photoZoom','photoFit'] as const)if(saved[key]!==undefined)(data as any)[key]=saved[key]
  const transforms={...data.elementTransforms?.[scope]};delete transforms.photo
  if(saved.transforms?.photo)transforms.photo=JSON.parse(JSON.stringify(saved.transforms.photo))
  data.elementTransforms={...data.elementTransforms,[scope]:transforms}
  notify('Восстановлено сохранённое кадрирование');return
 }
 const reset=parseChatGptResult(JSON.stringify(currentProject())).project.data
 for(const key of ['position','positionY','photoZoom','photoFit','elementTransforms'] as const)(data as any)[key]=reset[key]
 notify('Кадрирование сброшено')
}
const readyDriverPhoto=(id:string)=>'/assets/driver-scenes/uzbek-35-'+id+(id==='phone'?'-v2':id==='low-angle'?'-right-v2':'')+'.png'
function chooseReadyDriverPhoto(id:string){
 replaceAsset('image',readyDriverPhoto(id))
 data.position=50;data.positionY=45
 data.imagePrompt={...data.imagePrompt,age:'35',nationality:'Uzbek',style:id}
}
const readyCarAngle=ref('front-left')
const readyCarPhoto=(id:string)=>'/assets/car-scenes/'+id+(readyCarAngle.value==='side-left'?'-side-left.png':id==='concrete-wall'?'-front-left-right-v6.png':'-front-left-v5.png')
function chooseReadyCarPhoto(id:string){
 replaceAsset('image',readyCarPhoto(id))
 data.position=50;data.positionY=45
 data.carPrompt={...data.carPrompt,angle:readyCarAngle.value,street:id,time:['concrete-wall','underpass'].includes(id)?'day':'sunset'}
}
function replaceAsset(key:string,source:string){
 Object.assign(data,assetPlacementReset(data,key));(data as any)[key]=source
}
function upload(event:Event,key:string){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>15*1024*1024){notify('Выберите файл размером до 15 МБ');return}const reader=new FileReader();reader.onload=()=>{replaceAsset(key,String(reader.result));notify('Изображение обновлено')};reader.onerror=()=>notify('Не удалось прочитать изображение');reader.readAsDataURL(file)}
function pasteImage(event:ClipboardEvent){
 const target=event.target as HTMLElement | null
 if(target?.closest('input,textarea,[contenteditable="true"],[contenteditable="plaintext-only"]'))return
 const file=Array.from(event.clipboardData?.items || []).find(item=>item.kind==='file' && item.type.startsWith('image/'))?.getAsFile()
 if(!file)return
 const key=selected.value==='image'?'image':selected.value==='benefit'?'artwork':selected.value==='vehicle'?'vehicleImage':undefined
 if(!key){notify('Перед вставкой изображения выберите блок фото, иллюстрации или автомобиля');return}
 event.preventDefault()
 if(file.size>15*1024*1024){notify('Выберите изображение размером до 15 МБ');return}
 const reader=new FileReader()
 reader.onload=()=>{replaceAsset(key,String(reader.result));notify('Изображение вставлено')}
 reader.onerror=()=>notify('Не удалось прочитать изображение из буфера обмена')
 reader.readAsDataURL(file)
}
onMounted(()=>document.addEventListener('paste',pasteImage))
onBeforeUnmount(()=>document.removeEventListener('paste',pasteImage))
function save(){if(isDevelopment)saveAllFramingDefaults();try{localStorage.setItem('wb-bento',JSON.stringify({data,preset:preset.value,format:formatIndex.value}));notify('Проект сохранён на этом устройстве')}catch{notify('Хранилище заполнено. Попробуйте изображение меньшего размера.')}}
onMounted(()=>{try{const saved=JSON.parse(localStorage.getItem('wb-bento')||'null');if(saved){Object.assign(data,saved.data);data.vehicleImage=normalizeVehicleAsset(data.vehicleImage);const assets=presetAssets[saved.preset] || presetAssets[initialProject.preset];if(!data.image || data.image.startsWith('https://images.unsplash.com/'))data.image=assets.image;if(!data.artwork)data.artwork=assets.artwork;if(!data.vehicleImage)data.vehicleImage=assets.vehicleImage;if(saved.data.photoZoom===undefined && data.image===assets.image){data.position=assets.position;data.positionY=assets.positionY;data.photoZoom=assets.photoZoom;}data.wbLogo='/wb-taxi.svg';if(['#7015ff','#5421d6','#242424'].includes(data.accent.toLowerCase()))data.accent='#661AFF';preset.value=Number.isInteger(saved.preset) && saved.preset>=0 && saved.preset<presets.length?saved.preset:initialProject.preset;if(!saved.data.blockStyles || Object.keys(saved.data.blockStyles).length===0)data.blockStyles=presetStyles(preset.value);if(preset.value===7 && data.benefit==='аренда авто от 150000 сом/день')data.benefit='аренда авто\nот 150000\nсом/день';formatIndex.value=saved.format}}catch{}restoreFraming();ready.value=true})
async function renderProjectPng(){
 if(!artboard.value)throw new Error('Баннер ещё не готов')
 const previousSelection=selected.value;selected.value=''
 try{
  await nextTick();await document.fonts.ready
  await Promise.all(Array.from(artboard.value.querySelectorAll('img')).map(async image=>{await image.decode();if(!image.naturalWidth)throw new Error('Не удалось загрузить изображение')}))
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
  previewCanvas.value?.fitText();await nextTick()
  const node=artboard.value
  const bounds=node.getBoundingClientRect()
  return await toPng(node,{width:bounds.width,height:bounds.height,canvasWidth:format.value.w,canvasHeight:format.value.h,pixelRatio:1,cacheBust:true})
 }finally{selected.value=previousSelection}
}
async function download(){exporting.value=true;try{const url=await renderProjectPng();const a=document.createElement('a');a.download=`wb-bento-${format.value.w}x${format.value.h}.png`;a.href=url;a.click();notify('Баннер готов')}catch{notify('Не удалось экспортировать. Проверьте доступность всех изображений.')}finally{exporting.value=false}}
function currentProject(){
 const snapshot=JSON.parse(JSON.stringify(data))
 for(const scope of Object.keys(snapshot.elementTransforms || {}))snapshot.elementTransforms[scope]=Object.fromEntries(Object.entries(snapshot.elementTransforms[scope]).filter(([key])=>['photo','artwork','vehicle'].includes(key)))
 return validateProject({version:1,preset:preset.value,format:formatIndex.value,data:snapshot})
}
async function openProject(project:any){
 const validated=validateProject(project)
 Object.assign(data,structuredClone(defaults),validated.data);preset.value=validated.preset;formatIndex.value=validated.format;selected.value='';settingsTab.value='Canvas'
 await nextTick();previewCanvas.value?.fitText()
 return currentProject()
}
const onboarding=ref<{start:()=>void}>()
const chatgptFlow=ref<{open:()=>void}>()
const exchangeProject=computed(()=>currentProject())
function openChatGptFlow(){chatgptFlow.value?.open()}
onMounted(async()=>{
 const api={list_layouts:listLayouts,create_bento:async(input:any)=>openProject(createProject(input)),update_bento:async(patch:any)=>openProject(updateProject(currentProject(),patch)),get_bento:currentProject,open_bento:openProject,render_bento:renderProjectPng}
 ;(window as any).wbBento=api

})
onBeforeUnmount(()=>{delete (window as any).wbBento})

</script>
<template>
<div class="studio-shell">
 <StudioOnboarding ref="onboarding" @select-block="selectBlock"/>
 <header class="topbar">
  <div class="brand-home"><a class="wordmark" href="#" aria-label="WB Taxi Bento"><img class="header-logo" src="/wb-taxi-header.svg" alt="WB Taxi"/></a></div>
  <div class="header-actions"><UiButton variant="ghost" size="icon-sm" data-onboarding="help" aria-label="Как создать баннер" title="Как создать баннер" @click="onboarding?.start()"><CircleHelp class="size-4"/></UiButton><UiButton v-if="isDevelopment" variant="outline" size="sm" @click="saveAllFramingDefaults"><Save class="size-4"/>Сохранить настройки шаблона</UiButton><UiButton v-if="isDevelopment" variant="ghost" size="icon-sm" @click="exportFramingDefaults" aria-label="Экспорт настроек кадрирования" title="Экспорт настроек кадрирования"><Download class="size-4"/></UiButton><UiButton variant="ghost" size="sm" @click="openChatGptFlow"><Sparkles class="size-4"/>ChatGPT</UiButton><UiButton variant="outline" size="sm" @click="save"><Save class="size-4"/>Сохранить проект</UiButton><UiButton size="sm" data-onboarding="export" @click="download" :disabled="exporting"><LoaderCircle v-if="exporting" class="size-4 animate-spin"/><Download v-else class="size-4"/><span>{{exporting?'Экспорт…':'Экспорт PNG'}}</span></UiButton></div>
 </header>
 <ResizablePanelGroup direction="horizontal" class="workspace">
  <ResizablePanel :default-size="19" :min-size="15" :max-size="30" class="workspace-panel library-panel">
  <aside class="library" data-onboarding="templates"><div class="panel-heading"><span><Layers2 class="size-4"/>Шаблоны</span></div><div class="panel-tabs">
   <div class="library-content"><section v-for="group in templateGroups" :key="group.name" class="template-group" :aria-label="group.name"><h2 class="template-group-title">{{group.name}}</h2><div class="preset-grid"><UiButton variant="ghost" v-for="i in group.indices" :key="i" :aria-label="uiName(presets[i])" class="preset-card" :class="{active:preset===i}" @click="choosePreset(i)"><div class="preset-preview"><BentoCanvas :data="templatePreview(i)" :preset="i" :format="format" miniature/></div><span>{{uiName(presets[i])}}</span><small v-if="preset===i" aria-label="Выбранный шаблон"><Check class="size-3"/></small></UiButton></div></section></div>
   </div>
  </aside></ResizablePanel><ResizableHandle :disabled="compactWorkspace" class="workspace-handle" aria-label="Изменить ширину панели шаблонов"/><ResizablePanel :default-size="56" :min-size="30" class="workspace-panel canvas-panel">
  <main class="canvas-area" @pointerdown="clearCanvasSelection"><div class="canvas-toolbar"><UiBadge variant="outline" class="format-tag">{{format.w}} × {{format.h}} пикс.</UiBadge></div><div class="canvas-scroll"><div class="artboard-wrap" :style="{width:(formatIndex===2?330:format.w/format.h>1.5?700:560)*zoom/75+'px'}"><div ref="artboard" class="artboard"><BentoCanvas ref="previewCanvas" :data="data" :preset="preset" :format="format" :selected="selected" @select="selectBlock($event)" @photo-position="data.position=$event.x;data.positionY=$event.y" @copy-update="updateCopy($event)" @element-transform="updateElement($event)"/></div><div v-if="formatIndex===2 && showSafeGuides" class="story-guides" aria-hidden="true" :style="{aspectRatio:format.w+'/'+format.h}"><div class="story-guide-top" :style="{height:data.storySafeTop/format.h*100+'%'}"><span>Верхняя зона интерфейса · {{data.storySafeTop}} пикс.</span></div><div class="story-guide-bottom" :style="{height:data.storySafeBottom/format.h*100+'%'}"><span>Нижняя зона интерфейса · {{data.storySafeBottom}} пикс.</span></div></div><div class="below-canvas"><span><MousePointer2 class="size-3"/>Нажмите на блок, чтобы редактировать</span><span>{{format.ratio}}</span></div></div></div><div class="canvas-bottom"><span class="canvas-hint">Перетащите фото, чтобы настроить кадрирование</span><div class="zoom-control"><UiButton variant="ghost" size="icon-sm" @click="zoom=Math.max(35,zoom-10)" aria-label="Уменьшить"><Minus class="size-4"/></UiButton><span>{{zoom}}%</span><UiButton variant="ghost" size="icon-sm" @click="zoom=Math.min(115,zoom+10)" aria-label="Увеличить"><Plus class="size-4"/></UiButton></div></div></main></ResizablePanel><ResizableHandle :disabled="compactWorkspace" class="workspace-handle" aria-label="Изменить ширину панели настроек"/><ResizablePanel :default-size="25" :min-size="20" :max-size="38" class="workspace-panel inspector-panel">
  <ChatGptExchange ref="chatgptFlow" :project="exchangeProject" @apply="openProject"/>
  <AssetsPanel/>
  <FormatPanel data-onboarding="format" :format="formatIndex" @update:format="changeFormat" v-model:safe-top="data.storySafeTop" v-model:safe-bottom="data.storySafeBottom" v-model:guides="showSafeGuides"/>
  <aside class="inspector" data-onboarding="settings"><div class="panel-heading"><span><Settings2 class="size-4"/>Настройки</span></div><div class="panel-tabs"><div class="inspector-content">
    <div class="block-picker"><UiButton variant="ghost" size="xs" v-for="block in visibleBlocks" :key="block.key" :class="{active:selected===block.key}" @click="selectBlock(block.key)">{{block.name}}</UiButton></div>
    <div v-if="selected && selected!=='headline'" class="inspector-heading"><h2>{{selectedBlockName}}</h2></div>
    <p v-if="!selected" class="muted">Выберите блок на баннере или в списке выше</p>

    <section v-if="selected==='contacts'"><label>Сайт<UiInput v-model="data.website"/></label><label>Телефон<UiInput v-model="data.phone"/></label></section>
    <section v-if="selected==='headline'">
     <div v-if="preset>=8" class="city-field"><span>Города</span><CityChips v-model="data.city"/></div>
     <label>Заголовок<UiTextarea v-model="data.heading" rows="4"/></label>
     <label>Дополнительный текст<UiTextarea v-model="data.description" rows="2"/></label>

    </section>
    <section v-if="selected==='benefit'">
     <label>Текст преимущества<UiTextarea v-model="data.benefit" rows="4"/></label><div class="city-field" v-if="preset===5"><span>Города</span><CityChips v-model="data.city"/></div>
     <label class="upload-box"><img v-if="data.artwork" class="asset-thumbnail" :src="data.artwork"/><strong>{{data.artwork?'Заменить иллюстрацию':'Загрузить иллюстрацию'}}</strong><input type="file" accept="image/*" @change="upload($event,'artwork')"/></label>
     <UiButton variant="outline" v-if="data.artwork" class="button quiet" @click="data.artwork=''">Удалить иллюстрацию</UiButton>
     <div v-if="preset!==5" class="city-field"><span>Метки</span><CityChips v-model="labelText" kind="label"/></div>
    </section>
    <section v-if="selected==='image'">

     <div class="onboarding-photo-section" data-onboarding="photo-generation">
     <DriverPhotoPrompt v-model="data.imagePrompt" :ratio="format.ratio" :preset="preset"/>
     <CarPhotoPrompt v-model="data.carPrompt" :ratio="format.ratio" :preset="preset"/>
     </div>
     <div class="onboarding-photo-section" data-onboarding="photos">
     <UiCollapsible class="driver-prompt ready-car-photos"><UiCollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Images class="size-4"/><span>Готовые фото водителя</span><ChevronDown class="prompt-chevron size-4"/></UiButton></UiCollapsibleTrigger><UiCollapsibleContent class="prompt-content"><div class="prompt-options ready-car-grid" role="group" aria-label="Готовые фото водителя"><UiButton v-for="style in driverPhotoStyles" :key="style.id" variant="ghost" :aria-pressed="data.image===readyDriverPhoto(style.id)" @click="chooseReadyDriverPhoto(style.id)"><img :src="readyDriverPhoto(style.id)" alt="" loading="lazy"/><span>{{uiName(style.id)}}</span><Check v-if="data.image===readyDriverPhoto(style.id)" class="ready-car-check size-4"/></UiButton></div></UiCollapsibleContent></UiCollapsible>
     <UiCollapsible class="driver-prompt ready-car-photos"><UiCollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Images class="size-4"/><span>Готовые фото автомобиля</span><ChevronDown class="prompt-chevron size-4"/></UiButton></UiCollapsibleTrigger><UiCollapsibleContent class="prompt-content"><label>Ракурс<StudioSelect label="Ракурс готовых фото автомобиля" v-model="readyCarAngle" :options="[{value:'front-left',label:'Спереди слева'},{value:'side-left',label:'Левый бок'}]"/></label><div class="prompt-options ready-car-grid" role="group" aria-label="Готовые фото автомобиля"><UiButton v-for="scene in carStreets" :key="scene.id" variant="ghost" :aria-pressed="data.image===readyCarPhoto(scene.id)" @click="chooseReadyCarPhoto(scene.id)"><img :src="readyCarPhoto(scene.id)" alt="" loading="lazy"/><span>{{uiName(scene.id)}}</span><Check v-if="data.image===readyCarPhoto(scene.id)" class="ready-car-check size-4"/></UiButton></div></UiCollapsibleContent></UiCollapsible>
     <label class="photo-upload"><img :src="data.image"/><span><Upload class="size-4"/>Заменить фото</span><input type="file" accept="image/*" @change="upload($event,'image')"/></label>

     </div>
     <UiButton class="reset-photo-crop" variant="outline" @click="resetPhotoCrop">Сбросить кадрирование</UiButton>
     <div class="city-field" v-if="preset!==5 && preset<8"><span>Города</span><CityChips v-model="data.city"/></div>
    </section>
    <section v-if="selected==='vehicle'">
     <CarPhotoPrompt v-model="data.carPrompt" :ratio="format.ratio" :preset="preset"/>
     <label class="upload-box"><img v-if="data.vehicleImage" class="asset-thumbnail" :src="data.vehicleImage"/><strong>{{data.vehicleImage?'Заменить автомобиль':'Загрузить автомобиль без фона'}}</strong><small>PNG, WebP или SVG с прозрачным фоном</small><input type="file" accept="image/*" @change="upload($event,'vehicleImage')"/></label>
     <div class="range-field"><div class="range-heading"><label id="vehicle-scale-label">Масштаб</label><output>{{data.vehicleScale}}%</output></div><UiSlider :model-value="[data.vehicleScale]" :min="50" :max="260" @update:model-value="value=>data.vehicleScale=value?.[0] ?? 200" aria-labelledby="vehicle-scale-label"/></div>
     <div class="range-field"><div class="range-heading"><label id="vehicle-position-label">Положение по горизонтали</label><output>{{data.vehiclePosition}}%</output></div><UiSlider :model-value="[data.vehiclePosition]" :min="0" :max="230" @update:model-value="value=>data.vehiclePosition=value?.[0] ?? 190" aria-labelledby="vehicle-position-label"/></div>
     <div class="city-field"><span>Города</span><CityChips v-model="data.city"/></div>
    </section>
    <section v-if="selected==='partner' || (selected==='image' && preset===5)">
     <label>Язык подписи партнёра<StudioSelect v-model="partnerCaptionLanguage" label="Язык подписи партнёра" :options="partnerLanguages"/></label>
    </section>
    <section v-if="selected==='headline' || selected==='partner' || (selected==='image' && preset===5)" data-onboarding="partner-logo">
     <label>Название партнёра<UiInput v-model="data.partner"/></label>
     <label class="upload-box"><Upload class="size-5"/><img v-if="data.logo" class="asset-thumbnail" :src="data.logo" alt="Логотип партнёра"/><strong>{{data.logo?'Заменить логотип партнёра':'Загрузить логотип партнёра'}}</strong><small>SVG, PNG или WebP</small><input type="file" accept="image/svg+xml,image/png,image/webp" @change="upload($event,'logo')"/></label>
     <UiButton variant="outline" v-if="data.logo" class="button quiet" @click="data.logo=''">Использовать название партнёра</UiButton>
    </section>
    <section v-if="selected && !['contacts','format'].includes(selected) && (preset<8 || selected==='partner' || ([9,11,12].includes(preset) && selected==='headline')) && !([5,9,11,12].includes(preset) && selected==='partner')" class="block-style-controls">
     <div class="section-caption">Фон блока</div>
     <div class="block-style-options"><UiButton variant="outline" v-for="option in [{value:'default',name:'По умолчанию'},{value:'purple',name:'Фиолетовый'},{value:'pink',name:'Розовый'}]" :class="{active:(data.blockStyles?.[selected] || 'default')===option.value}" @click="setBlockStyle(option.value)"><i :class="option.value"></i>{{option.name}}</UiButton></div>
    </section>
  </div></div></aside>
  </ResizablePanel>
 </ResizablePanelGroup><Transition name="toast"><div v-if="toast" class="toast-message" role="status"><Check class="size-4"/>{{toast}}</div></Transition>
</div>
</template>
