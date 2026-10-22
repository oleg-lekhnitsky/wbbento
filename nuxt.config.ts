import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
 compatibilityDate:'2025-05-15',
 devtools:{enabled:false},
 ssr:false,
 modules:['shadcn-nuxt'],
 shadcn:{prefix:'Ui',componentDir:'./components/ui'},
 vite:{plugins:[tailwindcss()]},
 css:['~/assets/css/ui.css','~/assets/css/main.css','~/assets/css/studio.css'],
 app:{head:{
  title:'WB Bento — Partner creative studio',
  meta:[{name:'description',content:'Create on-brand partner creatives with editable bento layouts.'}],
 }},
})
