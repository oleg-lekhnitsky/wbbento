<script setup lang="ts">
import {Button as UiButton} from '~/components/ui/button'
import {Switch as UiSwitch} from '~/components/ui/switch'
import {Input as UiInput} from '~/components/ui/input'
import {Textarea as UiTextarea} from '~/components/ui/textarea'
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '~/components/ui/collapsible'
import {Sparkles,ChevronDown,Copy,Upload,Check} from '@lucide/vue'
import {createChatGptBrief,parseChatGptResult,applyChatGptImages,publicReferenceUrl} from '~/lib/chatgpt-exchange.mjs'
import angles from '~/data/car-references.json'
import {formatIds,formats} from '~/lib/bento-project.mjs'
import {driverPhotoStyles} from '~/lib/image-prompts.mjs'
const props=defineProps<{project:any}>()
const emit=defineEmits<{apply:[project:any]}>()
const opened=ref(false),request=ref(''),imageMode=ref('keep'),age=ref(props.project.data.imagePrompt.age),nationality=ref(props.project.data.imagePrompt.nationality)
const resultText=ref(''),status=ref(''),showBrief=ref(false),briefField=ref<any>(),pending=shallowRef<any>(),uploads=ref<Record<string,string>>({}),kept=ref<string[]>([]),busy=ref(false)
const changeOptions=[{id:'copy',label:'Text & language'},{id:'cities',label:'Cities'},{id:'offer',label:'Offer & labels'},{id:'partner',label:'Partner details'},{id:'format',label:'Banner size'}]
const step=ref(1),flowContent=ref<any>()
const steps=['Changes','ChatGPT','Import']
async function goStep(value:number){
 step.value=value;status.value=''
 await nextTick()
 const element=flowContent.value?.$el || flowContent.value
 element?.scrollTo({top:0})
}
const selectedChanges=ref(['copy'])
const suggestLayout=ref(true)
const driverStyle=ref(props.project.data.imagePrompt.style)
const language=ref(''),cities=ref(props.project.data.city),offer=ref(''),partner=ref(props.project.data.partner),website=ref(props.project.data.website),phone=ref(props.project.data.phone),targetFormat=ref(formatIds[props.project.format])
watch(()=>props.project,(next,previous)=>{
 if(!previous)return
 for(const [field,key] of [[cities,'city'],[partner,'partner'],[website,'website'],[phone,'phone']] as const){if(field.value===previous.data[key])field.value=next.data[key]}
 if(driverStyle.value===previous.data.imagePrompt.style)driverStyle.value=next.data.imagePrompt.style
 if(age.value===previous.data.imagePrompt.age)age.value=next.data.imagePrompt.age
 if(nationality.value===previous.data.imagePrompt.nationality)nationality.value=next.data.imagePrompt.nationality
 if(targetFormat.value===formatIds[previous.format])targetFormat.value=formatIds[next.format]
})
function toggleChange(id:string){selectedChanges.value=selectedChanges.value.includes(id)?selectedChanges.value.filter(value=>value!==id):[...selectedChanges.value,id]}
const changes=computed(()=>Object.fromEntries(selectedChanges.value.map(id=>[id,id==='copy'?{language:language.value}:id==='cities'?{cities:cities.value}:id==='offer'?{offer:offer.value}:id==='partner'?{partner:partner.value,website:website.value,phone:phone.value}:{format:targetFormat.value}])))
const siteOrigin=ref('')
onMounted(()=>{siteOrigin.value=window.location.origin})
const brief=computed(()=>createChatGptBrief(props.project,{driverStyle:driverStyle.value,suggestLayout:suggestLayout.value,siteOrigin:siteOrigin.value,request:request.value,changes:changes.value,imageMode:imageMode.value,age:age.value,nationality:nationality.value}))
const reference=computed(()=>imageMode.value==='car'?(angles.find(a=>a.id===props.project.data.carPrompt.angle)||angles[0]).src:'/assets/figma/'+(driverPhotoStyles.find(s=>s.id===driverStyle.value)||driverPhotoStyles[0]).image+'.png')
const copied=ref(false)
let copiedTimer:ReturnType<typeof setTimeout>|undefined
onBeforeUnmount(()=>clearTimeout(copiedTimer))
const imageStep=ref<HTMLElement>()
const canApply=computed(()=>pending.value && pending.value.images.every((i:any)=>uploads.value[i.slot]||kept.value.includes(i.slot)))
watch(resultText,()=>{pending.value=undefined;uploads.value={};kept.value=[];status.value=''})
defineExpose({open:()=>{opened.value=true}})
async function copyBrief(){
 copied.value=false;clearTimeout(copiedTimer)
 if(imageMode.value==='driver' && (!nationality.value.trim() || Number(age.value)<18 || Number(age.value)>100)){status.value='Enter a nationality and an age from 18 to 100.';return}
 try{await navigator.clipboard.writeText(brief.value);copied.value=true;copiedTimer=setTimeout(()=>copied.value=false,2500);status.value='Brief copied. Paste it into ChatGPT and attach the reference image if generating a photo.'}
 catch{showBrief.value=true;await nextTick();briefField.value?.$el?.select();status.value='Copy the brief below.'}
}
async function copyReference(){try{await copyReferenceImage(reference.value);status.value='Reference image copied. Paste it into the same ChatGPT conversation.'}catch{status.value='Could not copy the reference. Download it using the link below.'}}
async function review(){
 try{
  pending.value=parseChatGptResult(resultText.value,props.project);uploads.value={};kept.value=[]
  if(!pending.value.images.length){apply();return}
  status.value='Add the generated images, then apply the result.'
  await nextTick()
  imageStep.value?.focus({preventScroll:true})
  imageStep.value?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})
 }catch(error){status.value=(error as Error).message}
}
async function loadJson(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>25*1024*1024)throw new Error('Choose a JSON file under 25 MB.');resultText.value=await file.text();await nextTick();review()}catch(error){status.value=(error as Error).message}finally{input.value=''}}
async function loadImage(event:Event,slot:string){
 const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return
 busy.value=true
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('Choose a PNG, JPEG or WebP under 15 MB.')
  const source=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read image.'));reader.readAsDataURL(file)})
  const image=new Image();image.src=source;await image.decode()
  if(!image.naturalWidth)throw new Error('This image could not be decoded.')
  uploads.value={...uploads.value,[slot]:source};kept.value=kept.value.filter(s=>s!==slot);status.value='Image added. Apply when all slots are ready.'
 }catch(error){status.value=(error as Error).message}finally{busy.value=false;input.value=''}
}
function keep(slot:string){delete uploads.value[slot];kept.value=[...new Set([...kept.value,slot])]}
function apply(){try{const project=applyChatGptImages(pending.value,uploads.value,kept.value);emit('apply',project);pending.value=undefined;uploads.value={};kept.value=[];status.value='Result applied. Edit on the canvas, save or export PNG.'}catch(error){status.value=(error as Error).message}}
</script>
<template>
 <Collapsible v-model:open="opened" class="driver-prompt chatgpt-exchange">
  <CollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Sparkles class="size-4"/><span>Create with ChatGPT</span><ChevronDown class="prompt-chevron size-4"/></UiButton></CollapsibleTrigger>
  <CollapsibleContent ref="flowContent" class="prompt-content">
   <nav class="exchange-steps" aria-label="Generation steps"><UiButton v-for="(name,index) in steps" :key="name" variant="ghost" size="sm" :aria-current="step===index+1?'step':undefined" :aria-controls="'generation-step-'+(index+1)" @click="goStep(index+1)"><span>{{index+1}}</span>{{name}}</UiButton></nav>
   <section v-show="step===1" id="generation-step-1" class="exchange-step" aria-label="Choose changes">
   <p class="muted">Choose what to change. Everything else stays as it is.</p>
   <label class="safe-guide-toggle"><span>Suggest the best template</span><UiSwitch v-model="suggestLayout" aria-label="Suggest the best template"/></label>
   <p class="muted">ChatGPT will recommend an existing layout for your message. Turn off to keep this layout.</p>
   <fieldset class="exchange-changes"><legend>What would you like to change?</legend><div class="exchange-change-options"><UiButton v-for="option in changeOptions" :key="option.id" variant="outline" size="sm" :aria-pressed="selectedChanges.includes(option.id)" @click="toggleChange(option.id)"><Check v-if="selectedChanges.includes(option.id)" class="size-3"/>{{option.label}}</UiButton></div></fieldset>
   <label v-if="selectedChanges.includes('copy')">Language · optional<UiInput v-model="language" placeholder="e.g. Armenian, Russian, Uzbek"/><span class="field-hint">Rewrite the headline and supporting text. Leave blank to keep the language.</span></label>
   <label v-if="selectedChanges.includes('cities')">Cities for this banner<UiTextarea v-model="cities" rows="2" placeholder="Երևան"/><span class="field-hint">One city per line. Also updates city names in the copy.</span></label>
   <label v-if="selectedChanges.includes('offer')">New offer or labels<UiTextarea v-model="offer" rows="3" placeholder="Daily payouts, rental from 150,000 som/day, comfort and electric…"/><span class="field-hint">Updates the headline and supporting copy to match this offer.</span></label>
   <template v-if="selectedChanges.includes('partner')"><label>New partner name<UiInput v-model="partner"/></label><label>New website<UiInput v-model="website"/></label><label>New phone number<UiInput v-model="phone"/></label></template>
   <label v-if="selectedChanges.includes('format')">New banner size<StudioSelect v-model="targetFormat" label="New banner size" :options="formats.map((f,i)=>({value:formatIds[i],label:f.name+' · '+f.w+' × '+f.h}))"/></label>
   <label>Anything else? · optional<UiTextarea v-model="request" placeholder="e.g. A warmer tone, aimed at experienced drivers" rows="2"/></label>
   <div class="exchange-step-actions"><UiButton @click="goStep(2)">Continue to ChatGPT</UiButton></div>
   </section>
   <section v-show="step===2" id="generation-step-2" class="exchange-step" aria-label="Copy to ChatGPT">
   <p class="muted">Copy the brief into ChatGPT, choose a variant, then bring back its JSON.</p>
   <label>New photo<StudioSelect v-model="imageMode" label="New photo" :options="[{value:'keep',label:'Keep existing images'},{value:'driver',label:'Generate a driver photo'},{value:'car',label:'Generate a moving car photo'}]"/></label>
   <p class="exchange-result-hint muted">{{imageMode==='keep'?'You’ll get updated banner JSON. Your images stay the same.':'You’ll get banner JSON first. ChatGPT will ask before generating the photo.'}}</p>
   <div v-if="imageMode==='driver'" class="two-fields"><label>Age<UiInput v-model="age" type="number" min="18" max="100" placeholder="35"/></label><label>Nationality<UiInput v-model="nationality" placeholder="Armenian"/></label></div>
   <div v-if="imageMode==='driver'" class="prompt-options" role="group" aria-label="Driver references"><UiButton v-for="style in driverPhotoStyles" :key="style.id" variant="ghost" :aria-pressed="driverStyle===style.id" @click="driverStyle=style.id"><img :src="'/assets/figma/'+style.image+'.png'" alt=""/><span>{{style.name}}</span></UiButton></div>
   <p v-if="imageMode!=='keep'" class="muted">The brief includes all four driver references and all car angles, with warm directional sunlight and clean urban backgrounds without trees. {{publicReferenceUrl(siteOrigin,reference)?'Public reference URLs are included in the brief. Attach the image too if ChatGPT cannot access them.':'Attach the reference image in ChatGPT; localhost URLs cannot be accessed from your chat.'}}</p>
   <div class="reference-copy-actions"><UiButton @click="copyBrief"><Check v-if="copied" class="size-4"/><Copy v-else class="size-4"/>{{copied?'Copied':'Copy for ChatGPT'}}</UiButton><UiButton v-if="imageMode!=='keep'" variant="outline" @click="copyReference">Copy reference image</UiButton><UiButton variant="ghost" size="sm" @click="showBrief=!showBrief">{{showBrief?'Hide brief':'View brief'}}</UiButton></div>
   <a v-if="imageMode!=='keep'" class="car-reference-download" :href="reference" download>Download reference image</a>
   <label v-if="showBrief">Generation brief<UiTextarea class="prompt-preview" ref="briefField" :model-value="brief" readonly rows="8"/></label>
   <div class="exchange-step-actions"><UiButton variant="ghost" @click="goStep(1)">Back</UiButton><UiButton variant="outline" @click="goStep(3)">I have the result</UiButton></div>
   </section>
   <section v-show="step===3" id="generation-step-3" class="exchange-step exchange-import" aria-label="Import result">
    <p class="muted">Paste the final JSON from ChatGPT. If photos are needed, you’ll add them next.</p>
    <label>ChatGPT result JSON<UiTextarea class="exchange-result-json" v-model="resultText" placeholder="Paste the returned JSON code block" rows="5" spellcheck="false"/><span class="field-hint">Applies immediately if no new images are needed. Otherwise, continue to image upload.</span></label>
    <div class="reference-copy-actions"><UiButton :disabled="!resultText.trim()" @click="review">Import JSON</UiButton><label class="upload-box exchange-json-upload"><Upload class="size-4"/><strong>Upload JSON file</strong><input type="file" accept="application/json,.json" @change="loadJson"/></label></div>
    <div v-if="pending" ref="imageStep" class="exchange-image-step" tabindex="-1" aria-label="Add generated images">
     <h3>Add generated images</h3><p class="muted">Upload each requested image or keep the existing one, then apply the result.</p>
     <div v-for="item in pending.images" :key="item.slot" class="exchange-image-slot">
      <div class="range-heading"><strong>{{item.slot==='photo'?'Photo':item.slot==='vehicle'?'Vehicle cutout':item.slot==='artwork'?'Artwork':'Partner logo'}}</strong><span class="muted">{{kept.includes(item.slot)?'Keeping existing':uploads[item.slot]?'Image ready':'Image needed'}}</span></div>
      <label class="upload-box"><img v-if="uploads[item.slot]" class="asset-thumbnail" :src="uploads[item.slot]" alt="Imported image preview"/><strong>{{item.filename}}</strong><small>Upload the generated PNG, JPEG or WebP</small><input type="file" accept="image/png,image/jpeg,image/webp" @change="loadImage($event,item.slot)"/></label>
      <UiButton variant="ghost" size="sm" @click="keep(item.slot)">Keep existing image</UiButton>
     </div>
     <UiButton class="exchange-apply" :disabled="!canApply||busy" @click="apply">Apply result to canvas</UiButton>
    </div>
   <div class="exchange-step-actions"><UiButton variant="ghost" @click="goStep(2)">Back</UiButton></div>
   </section>
   <p role="status" aria-live="polite">{{status}}</p>
  </CollapsibleContent>
 </Collapsible>
</template>
