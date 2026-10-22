<script setup lang="ts">
import {X} from '@lucide/vue'
const props=withDefaults(defineProps<{modelValue:string;kind?:'city'|'label'}>(),{kind:'city'})
const emit=defineEmits<{'update:modelValue':[value:string]}>()
const draft=ref('')
const cities=computed(()=>props.modelValue.split('\n').map(city=>city.trim()).filter(Boolean))
function add(){
 const additions=draft.value.split(/[\n,;]+/).map(city=>city.trim()).filter(Boolean)
 if(!additions.length)return
 emit('update:modelValue',[...new Set([...cities.value,...additions])].join('\n'))
 draft.value=''
}
function remove(index:number){emit('update:modelValue',cities.value.filter((_,i)=>i!==index).join('\n'))}
function keydown(event:KeyboardEvent){
 if(event.isComposing)return
 if(event.key==='Enter'){event.preventDefault();add()}
}
function paste(event:ClipboardEvent){
 const text=event.clipboardData?.getData('text/plain')
 if(!text||!/[\n,;]/.test(text))return
 event.preventDefault();draft.value+=text;add()
}
</script>
<template>
 <div class="city-chips">
  <ul v-if="cities.length" class="city-chips-list" :aria-label="kind==='city'?'Добавленные города':'Добавленные метки'">
   <li v-for="(city,index) in cities" :key="index" class="city-input-chip"><span>{{city}}</span><button type="button" :aria-label="(kind==='city'?'Удалить город ':'Удалить метку ')+city" @click="remove(index)"><X class="size-3.5"/></button></li>
  </ul>
  <input v-model="draft" class="city-chips-input" :aria-label="kind==='city'?'Добавить город':'Добавить метку'" :placeholder="kind==='city'?'Добавить город…':'Добавить метку…'" @keydown="keydown" @blur="add" @paste="paste"/>
 </div>
 <span class="field-hint">{{kind==='city'?'Введите город и нажмите Enter':'Введите метку и нажмите Enter. Удалите все метки, чтобы скрыть их.'}}</span>
</template>
