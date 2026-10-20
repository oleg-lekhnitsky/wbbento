<script setup lang="ts">
const props = defineProps<{data:any; preset:number; format:any; selected?:string; miniature?:boolean}>()
const emit = defineEmits(['select'])
</script>
<template>
<div class="creative" :class="['layout-'+preset,{miniature, landscape:format.w/format.h>1.5, portrait:format.h/format.w>1.5}]" :style="{aspectRatio:format.w+'/'+format.h, '--accent':data.accent}" >
 <div class="bento-grid">
  <div class="tile headline" :class="{selected:selected==='headline'}" @click="emit('select','headline')"><div class="partner-brand"><img v-if="data.logo" :src="data.logo"/><template v-else><span class="brand-mark">◕</span> {{data.partner}}</template></div><h2>{{data.heading}}</h2><p>{{data.description}}</p></div>
  <div class="tile photograph" :class="{selected:selected==='image'}" @click="emit('select','image')"><img :src="data.image" :style="{objectPosition: data.position+'% center'}"/><span class="city">{{data.city}}</span></div>
  <div class="tile benefit" :class="{selected:selected==='benefit'}" @click="emit('select','benefit')"><h3>{{data.benefit}}</h3><div class="benefit-art"><span>↗</span><i>₽</i></div><div class="pills"><span>физ лица</span><span>ип</span></div></div>
  <div class="tile wb-partner" title="Locked brand block"><template v-if="data.wbLogo"><img :src="data.wbLogo" alt="WB Taxi"/><span>официальный<br/>партнер</span></template><template v-else><strong><b>wb</b> taxi</strong><span>официальный<br/>партнер</span></template></div>
 </div>
 <div class="creative-footer"><span>{{data.website}}</span><span>{{data.phone}}</span></div>
</div>
</template>
