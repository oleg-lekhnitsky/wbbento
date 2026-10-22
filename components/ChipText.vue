<script setup lang="ts">
const props=defineProps<{text:string;editable?:boolean}>()
const element=ref<HTMLElement>()
const focused=ref(false)
let composing=false,cancelled=false
function sync(){if(element.value && !focused.value)element.value.textContent=props.text}
const emit=defineEmits<{update:[value:string];finish:[]}>()
let original=''
function value(){return element.value?.innerText.replace(/[\r\n]+/g,' ') ?? ''}
async function blur(){composing=false;emit('update',cancelled?original:value());cancelled=false;focused.value=false;await nextTick();sync();emit('finish')}
function keydown(event:KeyboardEvent){if(event.isComposing||composing)return;if(event.key==='Enter'){event.preventDefault();element.value?.blur()}if(event.key==='Escape'){event.stopPropagation();event.preventDefault();cancelled=true;if(element.value)element.value.textContent=original;element.value?.blur()}}
watch(()=>props.text,sync,{flush:'post'})
onMounted(sync)
</script>
<template><span ref="element" class="chip-text" :contenteditable="editable?'plaintext-only':undefined" :spellcheck="false" @focus="focused=true;original=text;cancelled=false" @blur="blur" @keydown="keydown" @compositionstart="composing=true" @compositionend="composing=false"></span></template>
