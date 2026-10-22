<script setup lang="ts">
import imagePlacements from '~/data/figma-image-placements.json'
const props = defineProps<{data:any; preset:number; format:any; selected?:string; miniature?:boolean}>()
const emit = defineEmits(['select','photoPosition','copyUpdate','elementTransform'])
const dragging = ref(false)
const editingElement=ref('')
const artworkPlacement = computed(() => {
 const placement=(imagePlacements as Record<string,any>)[String(props.preset)]?.artwork
 return props.format.w===props.format.h && placement?.source===props.data.artwork ? placement : undefined
})
const artworkSource = computed(() => artworkPlacement.value?.rendered || (props.data.artwork==='/assets/figma/taxi-light.png'?'/assets/figma/taxi-light-cropped.svg':props.preset===5 && props.data.artwork==='/assets/figma/wallet.png'?'/assets/figma/wallet-placed.svg':props.data.artwork))
let drag: {id:number;x:number;y:number;positionX:number;positionY:number;overflowX:number;overflowY:number} | undefined
function startPhotoDrag(event:PointerEvent){
 if(props.miniature || event.button!==0 || (event.target as Element).closest('[data-transform-key]:not([data-transform-key="photo"]),[data-editor-control]'))return
 emit('select','image')
 const tile=event.currentTarget as HTMLElement
 const image=tile.querySelector('img')
 if(!image || !image.naturalWidth || props.data.photoFit==='contain')return
 const scale=Math.max(tile.clientWidth/image.naturalWidth,tile.clientHeight/image.naturalHeight)*(Number(props.data.photoZoom ?? 100)/100)
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,positionX:Number(props.data.position ?? 50),positionY:Number(props.data.positionY ?? 50),overflowX:image.naturalWidth*scale-tile.clientWidth,overflowY:image.naturalHeight*scale-tile.clientHeight}
 tile.setPointerCapture(event.pointerId)
 dragging.value=true
 event.preventDefault()
}
function movePhoto(event:PointerEvent){
 if(!drag || event.pointerId!==drag.id)return
 const clamp=(value:number)=>Math.max(0,Math.min(100,value))
 let x=drag.overflowX>0.5?clamp(drag.positionX-(event.clientX-drag.x)/drag.overflowX*100):drag.positionX
 let y=drag.overflowY>0.5?clamp(drag.positionY-(event.clientY-drag.y)/drag.overflowY*100):drag.positionY
 const guides: {axis:'x'|'y';position:number}[]=[]
 const tile=event.currentTarget as HTMLElement,rect=tile.getBoundingClientRect(),base=canvas.value?.getBoundingClientRect()
 if(base && !event.altKey){
  if(drag.overflowX>.5 && Math.abs((x-50)/100*drag.overflowX)<5){x=50;guides.push({axis:'x',position:rect.left-base.left+rect.width/2})}
  if(drag.overflowY>.5 && Math.abs((y-50)/100*drag.overflowY)<5){y=50;guides.push({axis:'y',position:rect.top-base.top+rect.height/2})}
 }
 editor.guides.value=guides
 emit('photoPosition',{x,y})
}
function stopPhotoDrag(event:PointerEvent){if(drag?.id!==event.pointerId)return;drag=undefined;dragging.value=false;editor.guides.value=[]}

const benefitLabels = computed(() => (props.data.benefitLabels !== undefined ? String(props.data.benefitLabels).split('\n') : [props.data.benefitLabel1 ?? (props.preset===1?'комфорт':'физ лица'),props.data.benefitLabel2 ?? (props.preset===1?'электро':'ип')]).map((label:string)=>String(label).trim()).filter(Boolean))
const cities = computed(() => [...new Set(String(props.data.city || '').split(/[\n,;]+/).map(city => city.trim()).filter(Boolean))])
const isDefaultPartner = computed(() => !['purple','pink'].includes(props.data.blockStyles?.partner))
const partnerLogo = computed(() => isDefaultPartner.value ? '/wb-taxi-mono.svg' : '/wb-taxi.svg')
const frameStyle = computed(() => {
 const story = props.format.w===1080 && props.format.h===1920
 const clamp=(value:number,fallback:number)=>Number.isFinite(value)?Math.max(40,Math.min(700,value)):fallback
 const landscape=props.format.w/props.format.h>1.5
 const columnWidth=(props.format.w-120)*1.05/2.9
 const brandScale=landscape?Math.min(1,(columnWidth-72)/440):1
 const unit=(pixels:number)=>`${pixels/(props.format.w-80)*100}cqw`
 const top=story?clamp(props.data.storySafeTop,250):40
 const bottom=story?clamp(props.data.storySafeBottom,340):40
 return {aspectRatio:props.format.w+'/'+props.format.h, '--accent':props.data.accent, '--card-inset':`${36/(props.format.w-80)*100}cqw`, '--grid-gap':`${20/(props.format.w-80)*100}cqw`, '--card-radius':`${44/(props.format.w-80)*100}cqw`, '--footer-gap':`${40/(props.format.w-80)*100}cqw`, '--strip-inset':`${20/(props.format.w-80)*100}cqw`, '--strip-gap':`${18/(props.format.w-80)*100}cqw`, '--partner-logo-size':unit(96*brandScale), '--partner-font-size':unit(51*brandScale), '--partner-gap':unit(18*brandScale), '--lockup-width':unit(440), '--support-size':unit(29), '--benefit-size':unit(49), '--label-size':unit(20), '--contact-size':unit(34), '--city-size':unit(29), '--chip-height':unit(27*1080/959), '--chip-font':unit(19.860891342*1080/959), '--chip-pad-x':unit(6*1080/959), '--chip-gap':unit(6*1080/959), '--chip-radius':unit(12*1080/959), '--location-height':unit(37.62059021*1080/959), '--location-font':unit(27.67327499*1080/959), '--location-pad-x':unit(12.36*1080/959), '--location-gap':unit(10.1406517*1080/959), '--location-radius':unit(16.72026062*1080/959), '--location-blur':unit(73.56915283203125/2*1080/959), padding:`${top/props.format.w*100}% ${40/props.format.w*100}% ${bottom/props.format.w*100}%`}
})
const vehicleStyle = computed(() => ({width:((props.data.vehicleScale ?? 200)/2)+'%',height:'calc(100% - var(--card-inset)*2)',left:(50+((props.data.vehiclePosition ?? 190)-190)*.5-(props.data.vehicleScale ?? 200)/4)+'%',right:'auto',top:'var(--card-inset)',bottom:'auto',padding:'0 var(--card-inset)',objectFit:'contain',objectPosition:'center'}))
const isFigmaVehicle = computed(() => props.data.vehicleImage?.startsWith('/assets/figma/taxi-side-'))
const photoLogo = '/wb-taxi-photo.svg'
const canvas = ref<HTMLElement>()
const scope=computed(()=>`${props.preset}:${props.format.w}x${props.format.h}`)
const editor=useCanvasElements(canvas,{
 scope:()=>scope.value,format:()=>props.format,values:()=>props.data.elementTransforms,
 enabled:()=>!props.miniature,
 update:(key,value)=>emit('elementTransform',{scope:scope.value,key,value}),
 select:block=>emit('select',block)
})
const {active:activeElement,box:elementBox,guides:smartGuides}=editor
const activeIsText=computed(()=>/^(website|phone|label-|.*city-)/.test(activeElement.value))
async function editElementText(key=activeElement.value){
 if(!activeIsText.value)return
 editingElement.value=key
 await nextTick()
 const target=Array.from(canvas.value?.querySelectorAll<HTMLElement>('[data-transform-key]') || []).find(el=>el.dataset.transformKey===key)
 const field=target?.matches('[contenteditable]')?target:target?.querySelector<HTMLElement>('[contenteditable]')
 field?.focus()
 if(field){const range=document.createRange();range.selectNodeContents(field);const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range)}
}
function elementDoubleClick(event:MouseEvent){const target=(event.target as Element).closest<HTMLElement>('[data-transform-key]');if(target){editor.select(target.dataset.transformKey!);editElementText(target.dataset.transformKey!)}}
watch(()=>props.selected,selected=>{if(!selected){editor.end();activeElement.value='';editor.guides.value=[];editingElement.value='';return}const el=Array.from(canvas.value?.querySelectorAll<HTMLElement>('[data-transform-key]') || []).find(el=>el.dataset.transformKey===activeElement.value);if(el?.dataset.editorBlock!==selected){activeElement.value='';editingElement.value=''}})
watch(scope,()=>{editingElement.value=''})
const photoTransform=computed(()=>{const v=editor.get('photo');const unit=props.format.w-80;return `translate(${v.x/unit*100}cqw,${v.y/unit*100}cqw) rotate(${v.rotation}deg) scale(${(props.data.photoFit==='contain'?1:(props.data.photoZoom ?? 100)/100)*v.scale})`})

const fitText = useFittedCopy(canvas, () => [props.data.heading, props.data.description, props.data.benefit, props.data.partner, props.data.logo, props.preset, props.format, props.data.storySafeTop, props.data.storySafeBottom, props.data.city, props.data.artwork, props.data.benefitLabels, props.data.benefitLabel1, props.data.benefitLabel2])
defineExpose({fitText})
</script>
<template>
<div ref="canvas" class="creative reference-creative" :class="['layout-'+preset,{miniature, landscape:format.w/format.h>1.5, portrait:format.h/format.w>1.5}]" :style="frameStyle" :tabindex="miniature?undefined:0" @pointerdown.capture="editor.down" @pointermove="editor.move" @pointerup="editor.end" @pointercancel="editor.end" @keydown="editor.keydown" @dblclick="elementDoubleClick">
 <div class="bento-grid">
  <div class="tile headline" :class="{selected:selected==='headline', 'block-purple':data.blockStyles?.headline==='purple', 'block-pink':data.blockStyles?.headline==='pink'}" @click="emit('select','headline')">
   <div class="partner-brand"><img v-if="data.logo" :src="data.logo" alt="Partner logo"/><template v-else><span><BrandText :text="data.partner"/></span></template></div>
   <div class="headline-copy"><InlineCopy tag="h2" :text="data.heading" :editable="!miniature" label="Headline" @select="emit('select','headline')" @update="emit('copyUpdate',{key:'heading',value:$event})"/><InlineCopy v-if="data.description" tag="p" :text="data.description" :editable="!miniature" label="Supporting text" @select="emit('select','headline')" @update="emit('copyUpdate',{key:'description',value:$event})"/></div>
  </div>
  <div class="tile photograph" data-transform-key="photo" data-editor-block="image" :class="{dragging, selected:selected==='image', 'block-purple':data.blockStyles?.image==='purple', 'block-pink':data.blockStyles?.image==='pink'}" @click="emit('select','image')" @pointerdown="startPhotoDrag" @pointermove="movePhoto" @pointerup="stopPhotoDrag" @pointercancel="stopPhotoDrag" @lostpointercapture="stopPhotoDrag"><img v-if="data.image" :src="data.image" :class="{'photo-cover':data.photoFit!=='contain'}" :style="{objectPosition:data.position+'% '+(data.positionY ?? 50)+'%',objectFit:data.photoFit || 'cover',transform:photoTransform,transformOrigin:data.position+'% '+(data.positionY ?? 50)+'%'}" alt="Campaign photo" draggable="false"/><div v-if="cities.length" class="city-list"><span v-for="(city,index) in cities" :key="index" class="city" :data-transform-key="'photo-city-'+index" data-editor-block="image" :style="editor.style('photo-city-'+index)"><ChipText @finish="editingElement=''" :text="city" :editable="!miniature" @update="emit('copyUpdate',{key:'city',index,value:$event})"/></span></div><div v-if="preset===5" class="photo-partner-brand"><img v-if="data.logo" :src="data.logo" alt="Partner logo"/><template v-else><span><BrandText :text="data.partner"/></span></template></div><div v-if="preset===5" class="photo-brand"><PartnerLockup :src="photoLogo" :caption="data.partnerCaption" photo/></div></div>
  <div class="tile benefit" :class="{selected:selected==='benefit', 'block-purple':data.blockStyles?.benefit==='purple', 'block-pink':data.blockStyles?.benefit==='pink', 'figma-art-overflow':artworkPlacement && !artworkPlacement.frameClips, 'art-taxi-light':data.artwork?.endsWith('/taxi-light.png'), 'art-wallet':data.artwork?.endsWith('/wallet.png'), 'art-keys':data.artwork?.endsWith('/keys.png')}" @click="emit('select','benefit')"><InlineCopy tag="h3" :text="data.benefit" :editable="!miniature" label="Benefit text" @select="emit('select','benefit')" @update="emit('copyUpdate',{key:'benefit',value:$event})"/><img v-if="data.artwork" class="reference-artwork" draggable="false" :src="artworkSource" :style="{...artworkPlacement?.style,...editor.style('artwork')}" data-transform-key="artwork" data-editor-block="benefit" alt="Benefit illustration"/><div v-if="preset===5" class="pills"><span v-for="(city,index) in cities" :key="index" :data-transform-key="'benefit-city-'+index" data-editor-block="benefit" :style="editor.style('benefit-city-'+index)"><ChipText @finish="editingElement=''" :text="city" :editable="!miniature" @update="emit('copyUpdate',{key:'city',index,value:$event})"/></span></div><div v-else class="pills"><span v-for="(label,index) in benefitLabels" :key="index" :data-transform-key="'label-'+index" data-editor-block="benefit" :style="editor.style('label-'+index)"><ChipText @finish="editingElement=''" :text="label" :editable="!miniature" @update="emit('copyUpdate',{key:'label',index,value:$event})"/></span></div></div>
  <div class="tile vehicle" :class="{selected:selected==='vehicle', 'block-purple':data.blockStyles?.vehicle==='purple', 'block-pink':data.blockStyles?.vehicle==='pink'}" @click="emit('select','vehicle')"><img v-if="isFigmaVehicle" class="figma-vehicle-image" src="/assets/figma/taxi-full.svg" :style="{width:((data.vehicleScale ?? 200)*1.08)+'%',height:'auto',right:'auto',left:(6+(data.vehiclePosition ?? 190)-190)+'%',...editor.style('vehicle')}" data-transform-key="vehicle" data-editor-block="vehicle" alt="Taxi vehicle"/><img v-else-if="data.vehicleImage" :src="data.vehicleImage" :style="{...vehicleStyle,...editor.style('vehicle')}" data-transform-key="vehicle" data-editor-block="vehicle" alt="Taxi vehicle"/><div v-if="cities.length" class="city-list"><span v-for="(city,index) in cities" :key="index" class="city" :data-transform-key="'vehicle-city-'+index" data-editor-block="vehicle" :style="editor.style('vehicle-city-'+index)"><ChipText @finish="editingElement=''" :text="city" :editable="!miniature" @update="emit('copyUpdate',{key:'city',index,value:$event})"/></span></div></div>
  <div class="tile wb-partner" :class="{selected:selected==='partner', 'block-purple':data.blockStyles?.partner==='purple', 'block-pink':data.blockStyles?.partner==='pink'}" title="Official partner block" @click="emit('select','partner')"><PartnerLockup :src="partnerLogo" :caption="data.partnerCaption"/></div>
 </div>
 <div class="creative-footer"><InlineCopy data-transform-key="website" data-editor-block="canvas" :style="editor.style('website')" :text="data.website" :editable="!miniature" label="Website" @finish="editingElement=''" @select="emit('select','canvas')" @update="emit('copyUpdate',{key:'website',value:$event})"/><InlineCopy data-transform-key="phone" data-editor-block="canvas" :style="editor.style('phone')" :text="data.phone" :editable="!miniature" label="Phone number" @finish="editingElement=''" @select="emit('select','canvas')" @update="emit('copyUpdate',{key:'phone',value:$event})"/></div>
 <Teleport v-if="!miniature && selected && canvas?.parentElement" :to="canvas.parentElement">
  <div v-for="(guide,index) in smartGuides" :key="index" class="smart-guide" :class="'smart-guide--'+guide.axis" :style="guide.axis==='x'?{left:guide.position+'px'}:{top:guide.position+'px'}" data-editor-control></div>
  <div v-if="activeElement && elementBox && !activeIsText" class="element-selection" @pointermove="editor.move" @pointerup="editor.end" @pointercancel="editor.end" :style="{left:elementBox.left+'px',top:elementBox.top+'px',width:elementBox.width+'px',height:elementBox.height+'px'}" data-editor-control>
   <button v-if="!activeIsText" class="element-move" aria-label="Move selected element" @pointerdown="editor.start($event,'move')">✥</button>
   <template v-if="!activeIsText"><button v-for="corner in ['nw','ne','sw','se']" :key="corner" class="element-handle" :class="'element-handle--'+corner" aria-label="Scale selected element" @pointerdown="editor.start($event,'scale')"></button>
   <button class="element-rotate" aria-label="Rotate selected element" @pointerdown="editor.start($event,'rotate')">↻</button></template>
   <div class="element-tools"><button v-if="!activeIsText" @pointerdown.stop @click.stop="editor.reset()">Reset</button><span v-if="!activeIsText">{{Math.round(editor.get(activeElement).scale*100)}}% · {{Math.round(editor.get(activeElement).rotation)}}°</span></div>
  </div>
 </Teleport>
</div>
</template>
