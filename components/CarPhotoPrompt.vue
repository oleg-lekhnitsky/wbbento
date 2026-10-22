<script setup lang="ts">
import { Button as UiButton } from '~/components/ui/button'
import { Input as UiInput } from '~/components/ui/input'
import { Textarea as UiTextarea } from '~/components/ui/textarea'
import { Collapsible as UiCollapsible, CollapsibleTrigger as UiCollapsibleTrigger, CollapsibleContent as UiCollapsibleContent } from '~/components/ui/collapsible'
import { ChevronDown, Sparkles, Copy, Image as ImageIcon, Download } from '@lucide/vue'

import {carStreets,carPhotoPrompt} from '~/lib/image-prompts.mjs'
import angles from '~/data/car-references.json'
const props=defineProps<{modelValue:{angle:string;street:string;location:string};ratio:string}>()
const emit=defineEmits(['update:modelValue'])
const chosen=computed(()=>angles.find(angle=>angle.id===props.modelValue.angle)||angles[0])
const streets=carStreets
const prompt=computed(()=>carPhotoPrompt(props.modelValue,props.ratio))
const output=ref<HTMLTextAreaElement | {$el:HTMLTextAreaElement}>(),status=ref('')
function update(key:string,value:string){status.value='';emit('update:modelValue',{...props.modelValue,[key]:value})}
async function copyImage(){
 try{await copyReferenceImage(chosen.value.src);status.value='Image copied'}
 catch{status.value='Image copying is unavailable in this browser.'}
}
async function copy(){try{await navigator.clipboard.writeText(prompt.value);status.value='Prompt copied'}catch{const field=output.value && ('$el' in output.value?output.value.$el:output.value);field?.focus();field?.select();status.value='Select and copy the prompt below.'}}
</script>
<template>
 <UiCollapsible class="driver-prompt car-prompt">
  <UiCollapsibleTrigger as-child><UiButton variant="ghost" class="prompt-trigger"><Sparkles class="size-4"/><span>Generate a moving car photo</span><ChevronDown class="prompt-chevron size-4"/></UiButton></UiCollapsibleTrigger><UiCollapsibleContent class="prompt-content">
  <p class="muted">Choose a car angle and street, then copy the reference image and prompt.</p>
  <div class="prompt-options" role="group" aria-label="Car angle">
   <UiButton variant="ghost" v-for="angle in angles" :key="angle.id" type="button" :aria-pressed="chosen.id===angle.id" @click="update('angle',angle.id)"><img :src="angle.src" alt=""/><span>{{angle.name}}</span></UiButton>
  </div>
  <a class="car-reference-download muted" :href="chosen.src" :download="'wb-taxi-'+chosen.id+'.png'"><Download class="size-3.5"/>Download reference</a>
  <label>Street background<StudioSelect label="Street background" :model-value="modelValue.street" :options="streets.map(street=>({value:street.id,label:street.name}))" @update:model-value="value=>update('street',value)"/></label>
  <label>City or location · optional<UiInput :model-value="modelValue.location" placeholder="e.g. Tashkent" @update:model-value="value=>update('location',String(value))"/></label>
  <label>Car image prompt<UiTextarea class="prompt-preview" ref="output" readonly :model-value="prompt" rows="7" spellcheck="false"/></label>
  <div class="reference-copy-actions"><UiButton variant="outline" class="button" type="button" @click="copyImage"><ImageIcon class="size-4"/>Copy image</UiButton><UiButton variant="outline" class="button" type="button" @click="copy"><Copy class="size-4"/>Copy prompt</UiButton></div>
  <p class="muted">Copy the image and prompt separately into your image generator.</p>
  <p role="status" aria-live="polite">{{status}}</p>
 </UiCollapsibleContent></UiCollapsible>
</template>
