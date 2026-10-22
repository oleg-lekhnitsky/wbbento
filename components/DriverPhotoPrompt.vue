<script setup lang="ts">
import { Button as UiButton } from '~/components/ui/button'
import { Input as UiInput } from '~/components/ui/input'
import { Textarea as UiTextarea } from '~/components/ui/textarea'
import { Collapsible as UiCollapsible, CollapsibleTrigger as UiCollapsibleTrigger, CollapsibleContent as UiCollapsibleContent } from '~/components/ui/collapsible'
import { ChevronDown, Sparkles, Copy, Image as ImageIcon, Download } from '@lucide/vue'

import {driverPhotoStyles,driverPhotoPrompt} from '~/lib/image-prompts.mjs'
const props=defineProps<{modelValue:{age:string;nationality:string;style:string}}>()
const emit=defineEmits(['update:modelValue'])
const options=driverPhotoStyles
const chosen=computed(()=>options.find(option=>option.id===props.modelValue.style)||options[0])
const valid=computed(()=>props.modelValue.nationality.trim().length>0 && Number(props.modelValue.age)>=18 && Number(props.modelValue.age)<=100)
const prompt=computed(()=>driverPhotoPrompt(props.modelValue))
const output=ref<HTMLTextAreaElement | {$el:HTMLTextAreaElement}>(),status=ref('')
function update(key:string,value:string){status.value='';emit('update:modelValue',{...props.modelValue,[key]:value})}
async function copyImage(){
 if(!valid.value)return
 try{await copyReferenceImage('/assets/figma/'+chosen.value.image+'.png');status.value='Image copied'}
 catch{status.value='Image copying is unavailable in this browser.'}
}
async function copy(){
 if(!valid.value)return
 try{await navigator.clipboard.writeText(prompt.value);status.value='Prompt copied'}
 catch{const field=output.value && ('$el' in output.value?output.value.$el:output.value);field?.focus();field?.select();status.value='Select and copy the prompt below.'}
}
</script>
<template>
 <UiCollapsible class="driver-prompt">
  <UiCollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Sparkles class="size-4"/><span>Generate a similar driver photo</span><ChevronDown class="prompt-chevron size-4"/></UiButton></UiCollapsibleTrigger><UiCollapsibleContent class="prompt-content">
  <p class="muted">Choose a reference style, enter age and nationality, then copy the prompt into your image generator.</p>
  <div class="two-fields">
   <label>Age<UiInput type="number" min="18" max="100" placeholder="e.g. 35" :model-value="modelValue.age" @update:model-value="value=>update('age',String(value))"/></label>
   <label>Nationality<UiInput placeholder="e.g. Uzbek" :model-value="modelValue.nationality" @update:model-value="value=>update('nationality',String(value))"/></label>
  </div>
  <div class="prompt-options" role="group" aria-label="Driver photo style">
   <UiButton variant="ghost" v-for="option in options" :key="option.id" type="button" :aria-pressed="chosen.id===option.id" @click="update('style',option.id)"><img :src="'/assets/figma/'+option.image+'.png'" alt=""/><span>{{option.name}}</span></UiButton>
  </div>
  <label>Image prompt<UiTextarea class="prompt-preview" ref="output" :model-value="prompt" readonly rows="7" spellcheck="false"/></label>
  <p class="muted">Copy the image and prompt separately into your image generator.</p>
  <div class="reference-copy-actions"><UiButton variant="outline" class="button" type="button" :disabled="!valid" @click="copyImage"><ImageIcon class="size-4"/>Copy image</UiButton><UiButton variant="outline" class="button" type="button" :disabled="!valid" @click="copy"><Copy class="size-4"/>Copy prompt</UiButton></div>
  <p v-if="!valid" class="muted">Enter a nationality and an age from 18 to 100.</p>
  <p role="status" aria-live="polite">{{status}}</p>
 </UiCollapsibleContent></UiCollapsible>
</template>
