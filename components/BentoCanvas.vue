<script setup lang="ts">
defineProps<{data:any; preset:number; format:any; selected?:string; miniature?:boolean}>()
const emit = defineEmits(['select'])
</script>
<template>
<div class="creative reference-creative" :class="['layout-'+preset,{miniature, landscape:format.w/format.h>1.5, portrait:format.h/format.w>1.5}]" :style="{aspectRatio:format.w+'/'+format.h, '--accent':data.accent}">
 <div class="bento-grid">
  <div class="tile headline" :class="{selected:selected==='headline'}" @click="emit('select','headline')">
   <div class="partner-brand"><img v-if="data.logo" :src="data.logo" alt="Partner logo"/><template v-else><svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M14 2h32v32H34V14H14zM2 14h12c0 12 8 20 20 20v12C15 46 2 33 2 14Z"/></svg><span>{{data.partner}}</span></template></div>
   <h2>{{data.heading}}</h2><p v-if="data.description">{{data.description}}</p>
  </div>
  <div class="tile photograph" :class="{selected:selected==='image'}" @click="emit('select','image')"><img v-if="data.image" :src="data.image" :style="{objectPosition:data.position+'% center'}" alt="Campaign photo"/><span class="city">{{data.city}}</span><div v-if="preset===5" class="photo-brand"><img v-if="data.wbLogo" :src="data.wbLogo" alt="WB Taxi"/><span>официальный<br/>партнер</span></div></div>
  <div class="tile benefit" :class="{selected:selected==='benefit'}" @click="emit('select','benefit')"><h3>{{data.benefit}}</h3><img v-if="data.artwork" class="reference-artwork" :src="data.artwork" alt="Benefit illustration"/><div class="pills"><span>{{preset===1?'комфорт':'физ лица'}}</span><span>{{preset===1?'электро':'ип'}}</span></div></div>
  <div class="tile vehicle" :class="{selected:selected==='vehicle'}" @click="emit('select','vehicle')"><img v-if="data.vehicleImage" :src="data.vehicleImage" alt="Taxi vehicle"/><span class="city">{{data.city}}</span></div>
  <div class="tile wb-partner" title="Locked brand block"><img :src="data.wbLogo || '/wb-taxi.svg'" alt="WB Taxi"/><span>официальный<br/>партнер</span></div>
 </div>
 <div class="creative-footer"><span>{{data.website}}</span><span>{{data.phone}}</span></div>
</div>
</template>
