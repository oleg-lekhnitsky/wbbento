<script setup lang="ts">
import {Button as UiButton} from '~/components/ui/button'
import {Input as UiInput} from '~/components/ui/input'
import {Switch as UiSwitch} from '~/components/ui/switch'
import {Scan} from '@lucide/vue'
import {formats} from '~/lib/bento-project.mjs'
import {uiName} from '~/lib/ui-ru.mjs'
const formatIndex=defineModel<number>('format',{required:true})
const safeTop=defineModel<number>('safeTop',{required:true})
const safeBottom=defineModel<number>('safeBottom',{required:true})
const showSafeGuides=defineModel<boolean>('guides',{required:true})
</script>
<template>
<section class="driver-prompt format-panel" aria-label="Формат">
<div class="format-panel-heading"><span><Scan class="size-4"/>Формат</span><small>{{formats[formatIndex].w}} × {{formats[formatIndex].h}} пикс.</small></div>
<div class="format-panel-content">

    <section><div class="format-grid"><UiButton variant="outline" v-for="(f,i) in formats" :class="{active:formatIndex===i}" :aria-pressed="formatIndex===i" :aria-label="uiName(f.name)+' · '+f.ratio" :title="uiName(f.name)" @click="formatIndex=i"><span class="ratio-icon" :style="{aspectRatio:f.w+'/'+f.h}"></span><strong>{{f.ratio}}</strong></UiButton></div></section>
    <section v-if="formatIndex===2"><div class="section-caption">Безопасная зона сторис</div><div class="two-fields"><label>Отступ сверху · пикс.<UiInput type="number" min="40" max="700" step="10" v-model.number="safeTop"/></label><label>Отступ снизу · пикс.<UiInput type="number" min="40" max="700" step="10" v-model.number="safeBottom"/></label></div><label class="safe-guide-toggle"><span>Показать направляющие</span><UiSwitch v-model="showSafeGuides" aria-label="Показать направляющие"/></label></section>


</div></section>
</template>
