<script setup lang="ts">
import {brandCopyParts} from '~/lib/brand-copy.mjs'
const props=defineProps<{text?:string}>()
const parts=computed(()=>brandCopyParts(props.text || ''))
</script>
<template><template v-for="(part,index) in parts" :key="index"><span v-if="part.type==='wb'" class="wb-text">w<span class="wb-text__b">b</span></span><span v-else-if="part.type==='taxi'">{{part.text[0]}}<span class="taxi-text__a">{{part.text[1]}}</span>{{part.text.slice(2)}}</span><template v-else>{{part.text}}</template></template></template>
