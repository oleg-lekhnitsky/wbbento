<script setup lang="ts">
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
import { Download, Save, Plus, Minus, Layers2, Settings2, Upload, Check, MousePointer2, LoaderCircle, Sparkles, ShieldCheck, Code2 } from '@lucide/vue'
import { toPng } from 'html-to-image'
import {parseChatGptResult} from '~/lib/chatgpt-exchange.mjs'
import { defaults, formats, presets, presetCopy, presetAssets, presetStyles, createProject, updateProject, validateProject, listLayouts, assetPlacementReset } from '~/lib/bento-project.mjs'

const compactWorkspace=useMediaQuery('(max-width: 850px)')
const previewCanvas=ref<{fitText:()=>void}>()
const data=reactive(structuredClone(defaults))
const labelText=computed({get:()=>data.benefitLabels ?? [data.benefitLabel1,data.benefitLabel2].filter(Boolean).join('\n'),set:(value:string)=>{data.benefitLabels=value}})
watch(()=>[data.heading,data.description,data.benefit,data.partner,data.city,data.website],()=>{
 for(const key of ['heading','description','benefit','partner','city','website'] as const){
  const normalized=data[key].replace(/(?<![\p{L}\p{N}_])wb(?![\p{L}\p{N}_])/giu,'wb')
  if(data[key]!==normalized)data[key]=normalized
 }
},{immediate:true})
const selectedBlockName=computed(()=>({headline:'Headline',benefit:'Benefit',image:'Photo',vehicle:'Vehicle',partner:'Official partner'}[selected.value] || 'Headline'))
function setBlockStyle(style:string){if(!['headline','benefit','image','vehicle','partner'].includes(selected.value))return;data.blockStyles={...data.blockStyles,[selected.value]:style}}
const preset=ref(3), selected=ref('headline'), zoom=ref(75), exporting=ref(false), toast=ref(''), artboard=ref<HTMLElement>(), ready=ref(false)

const formatIndex=ref(0),format=computed(()=>formats[formatIndex.value])
const showSafeGuides=ref(true)
const settingsTab=ref('Block')
const visibleBlocks=computed(()=>{
 const keys=preset.value===5?['image','benefit','partner']:formatIndex.value===3?['headline','benefit',...([1,6,7].includes(preset.value)?['vehicle']:['image']),'partner']
 :preset.value===0?['headline','image','partner']:preset.value===5?['image','benefit','partner']:[1,6,7].includes(preset.value)?['headline','benefit','vehicle','partner']:['headline','benefit','image','partner']
 const names:Record<string,string>={headline:'Headline',benefit:'Benefit',image:'Photo',vehicle:'Vehicle',partner:'Official partner'}
 return keys.map(key=>({key,name:names[key]}))
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

function choosePreset(index:number){if(index===preset.value)return;preset.value=index;applyPresetAssets(index);data.blockStyles=presetStyles(index);data.benefitLabels=undefined;data.benefitLabel1=index===1?'комфорт':'физ лица';data.benefitLabel2=index===1?'электро':'ип';[data.heading,data.description,data.benefit]=presetCopy[index]}

function notify(message:string){toast.value=message;setTimeout(()=>toast.value='',3500)}
function resetPhotoCrop(){
 const reset=parseChatGptResult(JSON.stringify(currentProject())).project.data
 for(const key of ['position','positionY','photoZoom','photoFit','elementTransforms'] as const)(data as any)[key]=reset[key]
 notify('Photo crop reset')
}
function replaceAsset(key:string,source:string){
 Object.assign(data,assetPlacementReset(data,key));(data as any)[key]=source
}
function upload(event:Event,key:string){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>15*1024*1024){notify('Please choose a file under 15 MB');return}const reader=new FileReader();reader.onload=()=>{replaceAsset(key,String(reader.result));notify('Asset updated')};reader.onerror=()=>notify('Could not read the image');reader.readAsDataURL(file)}
function pasteImage(event:ClipboardEvent){
 const target=event.target as HTMLElement | null
 if(target?.closest('input,textarea,[contenteditable="true"],[contenteditable="plaintext-only"]'))return
 const file=Array.from(event.clipboardData?.items || []).find(item=>item.kind==='file' && item.type.startsWith('image/'))?.getAsFile()
 if(!file)return
 const key=selected.value==='image'?'image':selected.value==='benefit'?'artwork':selected.value==='vehicle'?'vehicleImage':undefined
 if(!key){notify('Select a photo, artwork or vehicle block before pasting an image');return}
 event.preventDefault()
 if(file.size>15*1024*1024){notify('Please choose an image under 15 MB');return}
 const reader=new FileReader()
 reader.onload=()=>{replaceAsset(key,String(reader.result));notify('Image pasted')}
 reader.onerror=()=>notify('Could not read the clipboard image')
 reader.readAsDataURL(file)
}
onMounted(()=>document.addEventListener('paste',pasteImage))
onBeforeUnmount(()=>document.removeEventListener('paste',pasteImage))
function save(){try{localStorage.setItem('wb-bento',JSON.stringify({data,preset:preset.value,format:formatIndex.value}));notify('Project saved on this device')}catch{notify('Storage is full. Try using a smaller image.')}}
onMounted(()=>{try{const saved=JSON.parse(localStorage.getItem('wb-bento')||'null');if(saved){Object.assign(data,saved.data);const assets=presetAssets[saved.preset] || presetAssets[3];if(!data.image || data.image.startsWith('https://images.unsplash.com/'))data.image=assets.image;if(!data.artwork)data.artwork=assets.artwork;if(!data.vehicleImage)data.vehicleImage=assets.vehicleImage;if(saved.data.photoZoom===undefined && data.image===assets.image){data.position=assets.position;data.positionY=assets.positionY;data.photoZoom=assets.photoZoom;}data.wbLogo='/wb-taxi.svg';if(['#7015ff','#5421d6','#242424'].includes(data.accent.toLowerCase()))data.accent='#661AFF';preset.value=Number.isInteger(saved.preset) && saved.preset>=0 && saved.preset<presets.length?saved.preset:3;if(!saved.data.blockStyles || Object.keys(saved.data.blockStyles).length===0)data.blockStyles=presetStyles(preset.value);if(preset.value===7 && data.benefit==='аренда авто от 150000 сом/день')data.benefit='аренда авто\nот 150000\nсом/день';formatIndex.value=saved.format}}catch{}ready.value=true})
async function renderProjectPng(){
 if(!artboard.value)throw new Error('Canvas is not ready')
 const previousSelection=selected.value;selected.value=''
 try{
  await nextTick();await document.fonts.ready
  await Promise.all(Array.from(artboard.value.querySelectorAll('img')).map(async image=>{await image.decode();if(!image.naturalWidth)throw new Error('An image failed to load')}))
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
  previewCanvas.value?.fitText();await nextTick()
  const node=artboard.value
  const bounds=node.getBoundingClientRect()
  return await toPng(node,{width:bounds.width,height:bounds.height,canvasWidth:format.value.w,canvasHeight:format.value.h,pixelRatio:1,cacheBust:true})
 }finally{selected.value=previousSelection}
}
async function download(){exporting.value=true;try{const url=await renderProjectPng();const a=document.createElement('a');a.download=`wb-bento-${format.value.w}x${format.value.h}.png`;a.href=url;a.click();notify('Your creative is ready')}catch{notify('Export failed. Check that all images are available.')}finally{exporting.value=false}}
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
 <header class="topbar">
  <div class="brand-home"><a class="wordmark" href="#" aria-label="WB Taxi Bento"><img class="header-logo" src="/wb-taxi-header.svg" alt="WB Taxi"/></a></div>
  <div class="header-actions"><UiButton variant="ghost" size="sm" @click="openChatGptFlow"><Sparkles class="size-4"/>ChatGPT</UiButton><UiButton variant="outline" size="sm" @click="save"><Save class="size-4"/>Save project</UiButton><UiButton size="sm" @click="download" :disabled="exporting"><LoaderCircle v-if="exporting" class="size-4 animate-spin"/><Download v-else class="size-4"/><span>{{exporting?'Exporting…':'Export PNG'}}</span></UiButton></div>
 </header>
 <ResizablePanelGroup direction="horizontal" class="workspace">
  <ResizablePanel :default-size="19" :min-size="15" :max-size="30" class="workspace-panel library-panel">
  <aside class="library"><div class="panel-heading"><span><Layers2 class="size-4"/>Workspace</span></div><div class="panel-tabs">
   <div class="library-content"><div class="preset-grid"><UiButton variant="ghost" v-for="(name,i) in presets" class="preset-card" :class="{active:preset===i}" @click="choosePreset(i)"><div class="preset-preview"><BentoCanvas :data="i===preset?data:{...data,...presetAssets[i],benefitLabels:undefined,benefitLabel1:i===1?'комфорт':'физ лица',benefitLabel2:i===1?'электро':'ип',heading:presetCopy[i][0],description:presetCopy[i][1],benefit:presetCopy[i][2],blockStyles:presetStyles(i)}" :preset="i" :format="i===preset?format:formats[0]" miniature/></div><span>{{name}}</span><small v-if="preset===i" aria-label="Selected layout"><Check class="size-3"/></small></UiButton></div></div>
   </div>
  </aside></ResizablePanel><ResizableHandle :disabled="compactWorkspace" class="workspace-handle" aria-label="Resize layouts panel"/><ResizablePanel :default-size="56" :min-size="30" class="workspace-panel canvas-panel">
  <main class="canvas-area" @pointerdown="clearCanvasSelection"><div class="canvas-toolbar"><UiBadge variant="outline" class="format-tag">{{format.w}} × {{format.h}} px</UiBadge></div><div class="canvas-scroll"><div class="artboard-wrap" :style="{width:(formatIndex===2?330:formatIndex===3?700:560)*zoom/75+'px'}"><div ref="artboard" class="artboard"><BentoCanvas ref="previewCanvas" :data="data" :preset="preset" :format="format" :selected="selected" @select="selectBlock($event)" @photo-position="data.position=$event.x;data.positionY=$event.y" @copy-update="updateCopy($event)" @element-transform="updateElement($event)"/></div><div v-if="formatIndex===2 && showSafeGuides" class="story-guides" aria-hidden="true" :style="{aspectRatio:format.w+'/'+format.h}"><div class="story-guide-top" :style="{height:data.storySafeTop/format.h*100+'%'}"><span>Top UI area · {{data.storySafeTop}} px</span></div><div class="story-guide-bottom" :style="{height:data.storySafeBottom/format.h*100+'%'}"><span>Bottom UI area · {{data.storySafeBottom}} px</span></div></div><div class="below-canvas"><span><MousePointer2 class="size-3"/>Click a block to edit</span><span>{{format.ratio}}</span></div></div></div><div class="canvas-bottom"><span class="canvas-hint">Drag photos to adjust the crop</span><div class="zoom-control"><UiButton variant="ghost" size="icon-sm" @click="zoom=Math.max(35,zoom-10)" aria-label="Zoom out"><Minus class="size-4"/></UiButton><span>{{zoom}}%</span><UiButton variant="ghost" size="icon-sm" @click="zoom=Math.min(115,zoom+10)" aria-label="Zoom in"><Plus class="size-4"/></UiButton></div></div></main></ResizablePanel><ResizableHandle :disabled="compactWorkspace" class="workspace-handle" aria-label="Resize properties panel"/><ResizablePanel :default-size="25" :min-size="20" :max-size="38" class="workspace-panel inspector-panel">
  <ChatGptExchange ref="chatgptFlow" :project="exchangeProject" @apply="openProject"/>
  <aside class="inspector"><div class="panel-heading"><span><Settings2 class="size-4"/>Properties</span></div><UiTabs v-model="settingsTab" class="panel-tabs"><UiTabsList class="panel-tab-list"><UiTabsTrigger value="Block">Block settings</UiTabsTrigger><UiTabsTrigger value="Canvas">Canvas settings</UiTabsTrigger></UiTabsList><UiTabsContent :value="settingsTab" class="inspector-content">
   <template v-if="settingsTab==='Block'">
    <div class="block-picker"><UiButton variant="ghost" size="xs" v-for="block in visibleBlocks" :key="block.key" :class="{active:selected===block.key}" @click="selectBlock(block.key)">{{block.name}}</UiButton></div>
    <div class="inspector-heading"><h2>{{selectedBlockName}}</h2></div>
    <section v-if="selected==='headline'">
     <label>Headline<UiTextarea v-model="data.heading" rows="4"/></label>
     <label>Supporting text<UiTextarea v-model="data.description" rows="2"/></label>

    </section>
    <section v-if="selected==='benefit'">
     <label>Benefit text<UiTextarea v-model="data.benefit" rows="4"/></label><label v-if="preset===5">Cities<UiTextarea v-model="data.city" rows="3"/><span class="field-hint">One city per line</span></label>
     <label class="upload-box"><img v-if="data.artwork" class="asset-thumbnail" :src="data.artwork"/><strong>{{data.artwork?'Replace artwork':'Upload artwork'}}</strong><input type="file" accept="image/*" @change="upload($event,'artwork')"/></label>
     <UiButton variant="outline" v-if="data.artwork" class="button quiet" @click="data.artwork=''">Remove artwork</UiButton>
     <label v-if="preset!==5">Labels<UiTextarea aria-label="Labels" v-model="labelText" rows="3" placeholder="Add labels, one per line"/><span class="field-hint">One label per line. Leave empty for no labels.</span></label>
    </section>
    <section v-if="selected==='image'">

     <DriverPhotoPrompt v-model="data.imagePrompt"/>
     <CarPhotoPrompt v-model="data.carPrompt" :ratio="format.ratio"/>
     <label class="photo-upload"><img :src="data.image"/><span><Upload class="size-4"/>Replace photo</span><input type="file" accept="image/*" @change="upload($event,'image')"/></label>

     <UiButton class="reset-photo-crop" variant="outline" @click="resetPhotoCrop">Reset photo crop</UiButton>
     <label v-if="preset!==5">Cities<UiTextarea v-model="data.city" rows="3" placeholder="Ташкент&#10;Самарканд"/><span class="field-hint">One city per line</span></label>
    </section>
    <section v-if="selected==='vehicle'">
     <CarPhotoPrompt v-model="data.carPrompt" :ratio="format.ratio"/>
     <label class="upload-box"><img v-if="data.vehicleImage" class="asset-thumbnail" :src="data.vehicleImage"/><strong>{{data.vehicleImage?'Replace vehicle':'Upload vehicle cutout'}}</strong><small>Transparent PNG, WebP or SVG</small><input type="file" accept="image/*" @change="upload($event,'vehicleImage')"/></label>
     <div class="range-field"><div class="range-heading"><label id="vehicle-scale-label">Scale</label><output>{{data.vehicleScale}}%</output></div><UiSlider :model-value="[data.vehicleScale]" :min="50" :max="260" @update:model-value="value=>data.vehicleScale=value?.[0] ?? 200" aria-labelledby="vehicle-scale-label"/></div>
     <div class="range-field"><div class="range-heading"><label id="vehicle-position-label">Horizontal position</label><output>{{data.vehiclePosition}}%</output></div><UiSlider :model-value="[data.vehiclePosition]" :min="0" :max="230" @update:model-value="value=>data.vehiclePosition=value?.[0] ?? 190" aria-labelledby="vehicle-position-label"/></div>
     <label>Cities<UiTextarea v-model="data.city" rows="3" placeholder="Ташкент&#10;Самарканд"/><span class="field-hint">One city per line</span></label>
    </section>
    <section v-if="selected==='partner'">
     <label>Official partner caption<UiTextarea v-model="data.partnerCaption" rows="2"/></label>
     <label>Partner name<UiInput v-model="data.partner"/></label>
     <label class="upload-box"><Upload class="size-5"/><img v-if="data.logo" class="asset-thumbnail" :src="data.logo" alt="Partner logo"/><strong>{{data.logo?'Replace partner logo':'Upload partner logo'}}</strong><small>SVG, PNG or WebP</small><input type="file" accept="image/svg+xml,image/png,image/webp" @change="upload($event,'logo')"/></label>
     <UiButton variant="outline" v-if="data.logo" class="button quiet" @click="data.logo=''">Use partner name</UiButton>
    </section>
    <section v-if="!(preset===5 && selected==='partner')" class="block-style-controls">
     <div class="section-caption">Block background</div>
     <div class="block-style-options"><UiButton variant="outline" v-for="option in [{value:'default',name:'Default'},{value:'purple',name:'Purple'},{value:'pink',name:'Pink'}]" :class="{active:(data.blockStyles?.[selected] || 'default')===option.value}" @click="setBlockStyle(option.value)"><i :class="option.value"></i>{{option.name}}</UiButton></div>
    </section>
   </template>
   <template v-else>
    <section><div class="section-caption">Format</div><div class="format-grid"><UiButton variant="outline" v-for="(f,i) in formats" :class="{active:formatIndex===i}" @click="formatIndex=i"><span class="ratio-icon" :style="{aspectRatio:f.w+'/'+f.h}"></span><strong>{{f.name}}</strong><small>{{f.ratio}}</small></UiButton></div></section>
    <section v-if="formatIndex===2"><div class="section-caption">Story safe area</div><div class="two-fields"><label>Top clearance · px<UiInput type="number" min="40" max="700" step="10" v-model.number="data.storySafeTop"/></label><label>Bottom clearance · px<UiInput type="number" min="40" max="700" step="10" v-model.number="data.storySafeBottom"/></label></div><label class="safe-guide-toggle"><span>Show preview guides</span><UiSwitch v-model="showSafeGuides" aria-label="Show preview guides"/></label></section>
    <section><div class="section-caption">Contact details</div><label>Website<UiInput v-model="data.website"/></label><label>Phone number<UiInput v-model="data.phone"/></label></section>
   </template>
  </UiTabsContent></UiTabs></aside>
  </ResizablePanel>
 </ResizablePanelGroup><Transition name="toast"><div v-if="toast" class="toast-message" role="status"><Check class="size-4"/>{{toast}}</div></Transition>
</div>
</template>
