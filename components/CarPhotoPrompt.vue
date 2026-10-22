<script setup lang="ts">
import {uiName} from '~/lib/ui-ru.mjs'
import { Button as UiButton } from '~/components/ui/button'
import { Input as UiInput } from '~/components/ui/input'
import { Textarea as UiTextarea } from '~/components/ui/textarea'
import { Collapsible as UiCollapsible, CollapsibleTrigger as UiCollapsibleTrigger, CollapsibleContent as UiCollapsibleContent } from '~/components/ui/collapsible'
import { ChevronDown, Sparkles, Copy, Image as ImageIcon, Download } from '@lucide/vue'

import {carStreets,carTimes,carPhotoPrompt} from '~/lib/image-prompts.mjs'
import angles from '~/data/car-references.json'
const props=defineProps<{modelValue:{angle:string;street:string;location:string;time?:string};ratio:string;preset?:number}>()
const emit=defineEmits(['update:modelValue'])
const chosen=computed(()=>angles.find(angle=>angle.id===props.modelValue.angle)||angles[0])
const streets=carStreets
const prompt=computed(()=>carPhotoPrompt(props.modelValue,props.ratio,props.preset))
const output=ref<HTMLTextAreaElement | {$el:HTMLTextAreaElement}>(),status=ref('')
function update(key:string,value:string){status.value='';emit('update:modelValue',{...props.modelValue,[key]:value})}
async function copyImage(){
 try{await copyReferenceImage(chosen.value.src);status.value='Изображение скопировано'}
 catch{status.value='Копирование изображений недоступно в этом браузере.'}
}
async function copy(){try{await navigator.clipboard.writeText(prompt.value);status.value='Промпт скопирован'}catch{const field=output.value && ('$el' in output.value?output.value.$el:output.value);field?.focus();field?.select();status.value='Выделите и скопируйте промпт ниже.'}}
</script>
<template>
 <UiCollapsible class="driver-prompt car-prompt">
  <UiCollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Sparkles class="size-4"/><span>Создать фото машины в движении</span><ChevronDown class="prompt-chevron size-4"/></UiButton></UiCollapsibleTrigger><UiCollapsibleContent class="prompt-content">
  <p class="muted">Выберите ракурс машины и улицу, затем скопируйте образец и промпт.</p>
  <div class="prompt-options" role="group" aria-label="Ракурс автомобиля">
   <UiButton variant="ghost" v-for="angle in angles" :key="angle.id" type="button" :aria-pressed="chosen.id===angle.id" @click="update('angle',angle.id)"><img :src="angle.src" alt=""/><span>{{uiName(angle.id)}}</span></UiButton>
  </div>
  <a class="car-reference-download muted" :href="chosen.src" :download="'wb-taxi-'+chosen.id+'.png'"><Download class="size-3.5"/>Скачать образец</a>
  <label>Фон улицы<StudioSelect label="Фон улицы" :model-value="modelValue.street" :options="streets.map(street=>({value:street.id,label:uiName(street.id)}))" @update:model-value="value=>update('street',value)"/></label>
  <label>Время суток<StudioSelect label="Время суток" :model-value="modelValue.time || 'sunset'" :options="carTimes.map(time=>({value:time.id,label:uiName(time.id)}))" @update:model-value="value=>update('time',value)"/></label>
  <label>Город или место · необязательно<UiInput :model-value="modelValue.location" placeholder="Например, Ташкент" @update:model-value="value=>update('location',String(value))"/></label>
  <label>Промпт для фото автомобиля<UiTextarea class="prompt-preview" ref="output" readonly :model-value="prompt" rows="7" spellcheck="false"/></label>
  <div class="reference-copy-actions"><UiButton variant="outline" class="button" type="button" @click="copyImage"><ImageIcon class="size-4"/>Скопировать изображение</UiButton><UiButton variant="outline" class="button" type="button" @click="copy"><Copy class="size-4"/>Скопировать промпт</UiButton></div>
  <p class="muted">Скопируйте изображение и промпт отдельно в генератор изображений.</p>
  <p role="status" aria-live="polite">{{status}}</p>
 </UiCollapsibleContent></UiCollapsible>
</template>
