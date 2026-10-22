<script setup lang="ts">
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '~/components/ui/select'
defineProps<{modelValue:string;options:{value:string;label:string}[];label?:string}>()
const emit=defineEmits<{ 'update:modelValue':[value:string] }>()
</script>
<template><Select :model-value="modelValue" @update:model-value="value=>emit('update:modelValue',String(value))"><SelectTrigger class="w-full" :aria-label="label"><SelectValue/></SelectTrigger><SelectContent><SelectItem v-for="option in options" :key="option.value" :value="option.value">{{option.label}}</SelectItem></SelectContent></Select></template>
