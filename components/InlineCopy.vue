<script setup lang="ts">
import {renderBrandCopy} from '~/lib/brand-copy.mjs'
const props=withDefaults(defineProps<{text?:string;tag?:string;editable?:boolean;label:string}>(),{text:'',tag:'span',editable:true})
const emit=defineEmits<{update:[value:string];select:[];finish:[]}>()
const element=ref<HTMLElement>()
const focused=ref(false)
let original='',composing=false,cancelled=false
function sync(){if(element.value && !focused.value)renderBrandCopy(element.value,props.text)}
watch(()=>props.text,sync,{flush:'post'})
onMounted(sync)
function value(){return element.value?.innerText.replace(/\r/g,'').replace(/\n$/,'') ?? ''}
function input(){const text=value();if(!composing && text.trim())emit('update',text)}
function focus(){focused.value=true;original=props.text;cancelled=false;emit('select')}
async function blur(){composing=false;emit('update',cancelled?original:value());cancelled=false;focused.value=false;await nextTick();sync();emit('finish')}
function escape(event:KeyboardEvent){
 if(event.key!=='Escape'||event.isComposing)return
 event.preventDefault();event.stopPropagation()
 cancelled=true
 if(element.value)element.value.textContent=original
 element.value?.blur()
}
</script>
<template>
 <component :is="tag" ref="element" :contenteditable="editable?'plaintext-only':undefined" :role="editable?'textbox':undefined" :aria-label="editable?label:undefined" :aria-multiline="editable?true:undefined" :spellcheck="false" :class="{'inline-copy':editable,'is-editing':focused}" @focus="focus" @input="input" @blur="blur" @keydown="escape" @compositionstart="composing=true" @compositionend="composing=false;input()"/>
</template>
