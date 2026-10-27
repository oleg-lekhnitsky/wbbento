<script setup lang="ts">
import {uiName,uiError} from '~/lib/ui-ru.mjs'
import {Button as UiButton} from '~/components/ui/button'
import {Switch as UiSwitch} from '~/components/ui/switch'
import {Input as UiInput} from '~/components/ui/input'
import {Textarea as UiTextarea} from '~/components/ui/textarea'
import {Collapsible,CollapsibleTrigger,CollapsibleContent} from '~/components/ui/collapsible'
import {Sparkles,ChevronDown,Copy,Upload,Check} from '@lucide/vue'
import {createChatGptBrief,parseChatGptResult,applyChatGptImages,publicReferenceUrl,REFERENCE_SITE_ORIGIN} from '~/lib/chatgpt-exchange.mjs'
import angles from '~/data/car-references.json'
import {formatIds,formats} from '~/lib/bento-project.mjs'
import {driverPhotoStyles,carStreets,carTimes} from '~/lib/image-prompts.mjs'
const props=defineProps<{project:any}>()
const emit=defineEmits<{apply:[project:any]}>()
const opened=ref(false),request=ref(''),imageMode=ref('keep'),age=ref(props.project.data.imagePrompt.age),nationality=ref(props.project.data.imagePrompt.nationality)
const resultText=ref(''),status=ref(''),showBrief=ref(false),briefField=ref<any>(),pending=shallowRef<any>(),uploads=ref<Record<string,string>>({}),kept=ref<string[]>([]),busy=ref(false)
const changeOptions=[{id:'copy',label:'Текст и язык'},{id:'cities',label:'Города'},{id:'offer',label:'Предложение и метки'},{id:'partner',label:'Данные партнёра'},{id:'format',label:'Размер баннера'}]
const step=ref(1),flowContent=ref<any>()
const steps=['Изменения','ChatGPT','Импорт']
async function goStep(value:number){
 step.value=value;status.value=''
 await nextTick()
 const element=flowContent.value?.$el || flowContent.value
 element?.scrollTo({top:0})
}
const selectedChanges=ref(['copy'])
const suggestLayout=ref(true)
const driverStyle=ref(props.project.data.imagePrompt.style)
const carAngle=ref(props.project.data.carPrompt.angle)
const carTime=ref(props.project.data.carPrompt.time || 'sunset')
const carStreet=ref(props.project.data.carPrompt.street),carLocation=ref(props.project.data.carPrompt.location)
const language=ref(''),cities=ref(props.project.data.city),offer=ref(''),partner=ref(props.project.data.partner),website=ref(props.project.data.website),phone=ref(props.project.data.phone),targetFormat=ref(formatIds[props.project.format])
watch(()=>props.project,(next,previous)=>{
 if(!previous)return
 for(const [field,key] of [[cities,'city'],[partner,'partner'],[website,'website'],[phone,'phone']] as const){if(field.value===previous.data[key])field.value=next.data[key]}
 if(carAngle.value===previous.data.carPrompt.angle)carAngle.value=next.data.carPrompt.angle
 if(carTime.value===(previous.data.carPrompt.time || 'sunset'))carTime.value=next.data.carPrompt.time || 'sunset'
 if(carStreet.value===previous.data.carPrompt.street)carStreet.value=next.data.carPrompt.street
 if(carLocation.value===previous.data.carPrompt.location)carLocation.value=next.data.carPrompt.location
 if(driverStyle.value===previous.data.imagePrompt.style)driverStyle.value=next.data.imagePrompt.style
 if(age.value===previous.data.imagePrompt.age)age.value=next.data.imagePrompt.age
 if(nationality.value===previous.data.imagePrompt.nationality)nationality.value=next.data.imagePrompt.nationality
 if(targetFormat.value===formatIds[previous.format])targetFormat.value=formatIds[next.format]
})
function toggleChange(id:string){selectedChanges.value=selectedChanges.value.includes(id)?selectedChanges.value.filter(value=>value!==id):[...selectedChanges.value,id]}
const changes=computed(()=>Object.fromEntries(selectedChanges.value.map(id=>[id,id==='copy'?{language:language.value}:id==='cities'?{cities:cities.value}:id==='offer'?{offer:offer.value}:id==='partner'?{partner:partner.value,website:website.value,phone:phone.value}:{format:targetFormat.value}])))
const preparingBrief=ref(false)
const siteOrigin=REFERENCE_SITE_ORIGIN
const brief=computed(()=>createChatGptBrief(props.project,{carAngle:carAngle.value,carStreet:carStreet.value,carTime:carTime.value,carLocation:carLocation.value,driverStyle:driverStyle.value,suggestLayout:suggestLayout.value,siteOrigin,request:request.value,changes:changes.value,imageMode:imageMode.value,age:age.value,nationality:nationality.value}))
const reference=computed(()=>imageMode.value==='car'?(angles.find(a=>a.id===carAngle.value)||angles[0]).src:'/assets/figma/'+(driverPhotoStyles.find(s=>s.id===driverStyle.value)||driverPhotoStyles[0]).image+'.png')
const copied=ref(false)
let copiedTimer:ReturnType<typeof setTimeout>|undefined
onBeforeUnmount(()=>clearTimeout(copiedTimer))
watch(brief,()=>{copied.value=false;clearTimeout(copiedTimer)})
const imageStep=ref<HTMLElement>()
const canApply=computed(()=>pending.value && pending.value.images.every((i:any)=>uploads.value[i.slot]||kept.value.includes(i.slot)))
watch(resultText,()=>{pending.value=undefined;uploads.value={};kept.value=[];status.value=''})
defineExpose({open:()=>{opened.value=true}})
async function prepareBrief(){
 if(imageMode.value==='driver' && (!nationality.value.trim() || Number(age.value)<18 || Number(age.value)>55))throw new Error('Укажите национальность и возраст от 18 до 55 лет.')

 return brief.value
}
async function toggleBrief(){
 if(showBrief.value){showBrief.value=false;return}
 preparingBrief.value=true
 try{await prepareBrief();showBrief.value=true}catch(error){status.value=uiError(error)}finally{preparingBrief.value=false}
}
async function copyBrief(){
 copied.value=false;clearTimeout(copiedTimer);preparingBrief.value=true
 try{
  const text=await prepareBrief()
  try{await navigator.clipboard.writeText(text);copied.value=true;copiedTimer=setTimeout(()=>copied.value=false,2500);status.value='Промпт скопирован. Вставьте его в ChatGPT и при необходимости прикрепите образец.'}
  catch{showBrief.value=true;await nextTick();briefField.value?.$el?.select();status.value='Скопируйте промпт ниже или скачайте текстовый файл.'}
 }catch(error){status.value=uiError(error)}finally{preparingBrief.value=false}
}
async function downloadBrief(){
 preparingBrief.value=true
 try{const text=await prepareBrief(),url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const link=document.createElement('a');link.href=url;link.download='wb-bento-chatgpt-brief.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(error){status.value=uiError(error)}finally{preparingBrief.value=false}
}

async function copyReference(){try{await copyReferenceImage(reference.value);status.value='Образец скопирован. Вставьте его в тот же чат ChatGPT.'}catch{status.value='Не удалось скопировать образец. Скачайте его по ссылке ниже.'}}
async function review(){
 try{
  pending.value=parseChatGptResult(resultText.value,props.project);uploads.value={};kept.value=[]
  if(!pending.value.images.length){apply();return}
  status.value='Добавьте созданные изображения и примените результат.'
  await nextTick()
  imageStep.value?.focus({preventScroll:true})
  imageStep.value?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})
 }catch(error){status.value=uiError(error)}
}
async function loadJson(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>25*1024*1024)throw new Error('Выберите файл JSON размером до 25 МБ.');resultText.value=await file.text();await nextTick();review()}catch(error){status.value=uiError(error)}finally{input.value=''}}
async function loadImage(event:Event,slot:string){
 const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return
 busy.value=true
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('Выберите PNG, JPEG или WebP размером до 15 МБ.')
  const source=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Не удалось прочитать изображение.'));reader.readAsDataURL(file)})
  const image=new Image();image.src=source;await image.decode()
  if(!image.naturalWidth)throw new Error('Не удалось открыть изображение.')
  uploads.value={...uploads.value,[slot]:source};kept.value=kept.value.filter(s=>s!==slot);status.value='Изображение добавлено. Примените результат, когда все изображения будут готовы.'
 }catch(error){status.value=uiError(error)}finally{busy.value=false;input.value=''}
}
function keep(slot:string){delete uploads.value[slot];kept.value=[...new Set([...kept.value,slot])]}
function apply(){try{const project=applyChatGptImages(pending.value,uploads.value,kept.value);emit('apply',project);pending.value=undefined;uploads.value={};kept.value=[];status.value='Результат применён. Отредактируйте баннер, сохраните проект или экспортируйте PNG.'}catch(error){status.value=uiError(error)}}
</script>
<template>
 <Collapsible v-model:open="opened" class="driver-prompt chatgpt-exchange">
  <CollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Sparkles class="size-4"/><span>Создать с ChatGPT</span><ChevronDown class="prompt-chevron size-4"/></UiButton></CollapsibleTrigger>
  <CollapsibleContent ref="flowContent" class="prompt-content">
   <nav class="exchange-steps" aria-label="Шаги создания"><UiButton v-for="(name,index) in steps" :key="name" variant="ghost" size="sm" :aria-current="step===index+1?'step':undefined" :aria-controls="'generation-step-'+(index+1)" @click="goStep(index+1)"><span>{{index+1}}</span>{{name}}</UiButton></nav>
   <section v-show="step===1" id="generation-step-1" class="exchange-step" aria-label="Выбор изменений">
   <p class="muted">Выберите, что изменить. Остальное останется как есть.</p>
   <label class="safe-guide-toggle"><span>Подобрать шаблон</span><UiSwitch v-model="suggestLayout" aria-label="Подобрать шаблон"/></label>
   <p class="muted">ChatGPT предложит шаблон под вашу задачу. Отключите, чтобы сохранить текущий.</p>
   <fieldset class="exchange-changes"><legend>Что вы хотите изменить?</legend><div class="exchange-change-options"><UiButton v-for="option in changeOptions" :key="option.id" variant="outline" size="sm" :aria-pressed="selectedChanges.includes(option.id)" @click="toggleChange(option.id)"><Check v-if="selectedChanges.includes(option.id)" class="size-3"/>{{option.label}}</UiButton></div></fieldset>
   <label v-if="selectedChanges.includes('copy')">Язык · необязательно<UiInput v-model="language" placeholder="Например, армянский, русский, узбекский"/><span class="field-hint">Переписать заголовок и дополнительный текст. Оставьте пустым, чтобы сохранить язык.</span></label>
   <div v-if="selectedChanges.includes('cities')" class="city-field"><span>Города на баннере</span><CityChips v-model="cities"/><span class="field-hint">Названия обновятся и в тексте.</span></div>
   <label v-if="selectedChanges.includes('offer')">Новое предложение или метки<UiTextarea v-model="offer" rows="3" placeholder="Ежедневные выплаты, аренда от 150 000 сум/день, комфорт и электро…"/><span class="field-hint">Заголовок и дополнительный текст будут адаптированы под предложение.</span></label>
   <template v-if="selectedChanges.includes('partner')"><label>Новое название партнёра<UiInput v-model="partner"/></label><label>Новый сайт<UiInput v-model="website"/></label><label>Новый номер телефона<UiInput v-model="phone"/></label></template>
   <label v-if="selectedChanges.includes('format')">Новый размер баннера<StudioSelect v-model="targetFormat" label="Новый размер баннера" :options="formats.map((f,i)=>({value:formatIds[i],label:uiName(f.name)+' · '+f.w+' × '+f.h}))"/></label>
   <label>Что-то ещё? · необязательно<UiTextarea v-model="request" placeholder="Например, дружелюбный тон для опытных водителей" rows="2"/></label>
   <div class="exchange-step-actions"><UiButton @click="goStep(2)">Перейти к ChatGPT</UiButton></div>
   </section>
   <section v-show="step===2" id="generation-step-2" class="exchange-step" aria-label="Копирование в ChatGPT">
   <p class="muted">Скопируйте промпт в ChatGPT, выберите вариант и вернитесь с его JSON.</p>
   <label>Новое фото<StudioSelect v-model="imageMode" label="Новое фото" :options="[{value:'keep',label:'Сохранить текущие изображения'},{value:'driver',label:'Создать фото водителя'},{value:'car',label:'Создать фото машины в движении по образцу'}]"/></label>
   <p v-if="imageMode==='car'" class="muted">Переносит выбранный автомобиль в новую уличную сцену с сохранением машины и оформления WB.</p>
   <p class="exchange-result-hint muted">{{imageMode==='keep'?'Вы получите обновлённый JSON баннера. Изображения останутся прежними.':'Сначала вы получите JSON баннера. Перед созданием фото ChatGPT спросит подтверждение.'}}</p>
   <div v-if="imageMode==='driver'" class="two-fields"><label>Возраст<UiInput v-model="age" type="number" min="18" max="55" placeholder="35"/></label><label>Национальность<UiInput v-model="nationality" placeholder="Армянин"/></label></div>
   <div v-if="imageMode==='driver'" class="prompt-options" role="group" aria-label="Образцы фото водителя"><UiButton v-for="style in driverPhotoStyles" :key="style.id" variant="ghost" :aria-pressed="driverStyle===style.id" @click="driverStyle=style.id"><img :src="'/assets/figma/'+style.image+'.png'" alt=""/><span>{{uiName(style.id)}}</span></UiButton></div>
   <div v-if="imageMode==='car'" class="prompt-options exchange-car-references" role="group" aria-label="Образцы автомобилей"><UiButton v-for="angle in angles" :key="angle.id" variant="ghost" :aria-pressed="carAngle===angle.id" @click="carAngle=angle.id"><img :src="angle.src" alt=""/><span>{{uiName(angle.id)}}</span></UiButton></div>
   <template v-if="imageMode==='car'">
    <label>Фон улицы<StudioSelect v-model="carStreet" label="Фон улицы" :options="carStreets.map(street=>({value:street.id,label:uiName(street.id)}))"/></label>
    <label>Время суток<StudioSelect v-model="carTime" label="Время суток" :options="carTimes.map(time=>({value:time.id,label:uiName(time.id)}))"/></label>
    <label>Город или место · необязательно<UiInput v-model="carLocation" placeholder="Например, Ташкент"/></label>
   </template>
   <p v-if="imageMode!=='keep'" class="muted">Промпт содержит все образцы фото водителя и все ракурсы автомобиля: тёплый направленный солнечный свет и городской фон без деревьев. {{publicReferenceUrl(siteOrigin,reference)?'В промпте есть публичные ссылки на образцы. Для точного соответствия скопируйте выбранное изображение и прикрепите его вместе с промптом.':'Прикрепите образец в ChatGPT: локальные ссылки недоступны из чата.'}}</p>
   <div class="reference-copy-actions"><UiButton :disabled="preparingBrief" @click="copyBrief"><Check v-if="copied" class="size-4"/><Copy v-else class="size-4"/>{{preparingBrief?'Подготовка…':copied?'Скопировано':'Скопировать для ChatGPT'}}</UiButton><UiButton variant="outline" :disabled="preparingBrief" @click="downloadBrief">Скачать промпт</UiButton><UiButton v-if="imageMode!=='keep'" variant="outline" @click="copyReference">Скопировать образец</UiButton><UiButton variant="ghost" size="sm"  :disabled="preparingBrief" @click="toggleBrief">{{showBrief?'Скрыть промпт':'Показать промпт'}}</UiButton></div>
   <a v-if="imageMode!=='keep'" class="car-reference-download" :href="reference" download>Скачать образец</a>
   <label v-if="showBrief">Промпт для генерации<UiTextarea class="prompt-preview" ref="briefField" :model-value="brief" readonly rows="8"/></label>
   <div class="exchange-step-actions"><UiButton variant="ghost" @click="goStep(1)">Назад</UiButton><UiButton variant="outline" @click="goStep(3)">У меня есть результат</UiButton></div>
   </section>
   <section v-show="step===3" id="generation-step-3" class="exchange-step exchange-import" aria-label="Импорт результата">
    <p class="muted">Вставьте итоговый JSON из ChatGPT. Если нужны фото, вы добавите их на следующем шаге.</p>
    <label>JSON из ChatGPT<UiTextarea class="exchange-result-json" v-model="resultText" placeholder="Вставьте полученный код JSON" rows="5" spellcheck="false"/><span class="field-hint">Если новые изображения не нужны, результат применится сразу. Иначе загрузите изображения на следующем шаге.</span></label>
    <div class="reference-copy-actions"><UiButton :disabled="!resultText.trim()" @click="review">Импортировать JSON</UiButton><label class="upload-box exchange-json-upload"><Upload class="size-4"/><strong>Загрузить файл JSON</strong><input type="file" accept="application/json,.json" @change="loadJson"/></label></div>
    <div v-if="pending" ref="imageStep" class="exchange-image-step" tabindex="-1" aria-label="Добавить созданные изображения">
     <h3>Добавить созданные изображения</h3><p class="muted">Загрузите нужные изображения или сохраните текущие, затем примените результат.</p>
     <div v-for="item in pending.images" :key="item.slot" class="exchange-image-slot">
      <div class="range-heading"><strong>{{item.slot==='photo'?'Фото':item.slot==='vehicle'?'Автомобиль без фона':item.slot==='artwork'?'Иллюстрация':'Логотип партнёра'}}</strong><span class="muted">{{kept.includes(item.slot)?'Сохранено текущее':uploads[item.slot]?'Изображение готово':'Нужно изображение'}}</span></div>
      <label class="upload-box"><img v-if="uploads[item.slot]" class="asset-thumbnail" :src="uploads[item.slot]" alt="Предпросмотр загруженного изображения"/><strong>{{item.filename}}</strong><small>Загрузите созданный PNG, JPEG или WebP</small><input type="file" accept="image/png,image/jpeg,image/webp" @change="loadImage($event,item.slot)"/></label>
      <UiButton variant="ghost" size="sm" @click="keep(item.slot)">Сохранить текущее изображение</UiButton>
     </div>
     <UiButton class="exchange-apply" :disabled="!canApply||busy" @click="apply">Применить к баннеру</UiButton>
    </div>
   <div class="exchange-step-actions"><UiButton variant="ghost" @click="goStep(2)">Назад</UiButton></div>
   </section>
   <p role="status" aria-live="polite">{{status}}</p>
  </CollapsibleContent>
 </Collapsible>
</template>
