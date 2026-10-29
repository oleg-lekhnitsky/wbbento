import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
 compatibilityDate:'2025-05-15',
 devtools:{enabled:false},
 ssr:false,
 routeRules:{'/**':{headers:{'X-Robots-Tag':'noindex, nofollow, noarchive'}}},
 modules:['shadcn-nuxt'],
 shadcn:{prefix:'Ui',componentDir:'./components/ui'},
 vite:{plugins:[tailwindcss()]},
 css:['~/assets/css/ui.css','~/assets/css/main.css','~/assets/css/studio.css'],
 app:{head:{
  htmlAttrs:{lang:'ru'},
  title:'wb taxi — баннеры для партнёров',
  link:[{rel:'icon',type:'image/svg+xml',href:'/favicon.svg'}],
  meta:[
   {name:'description',content:'Создавайте фирменные баннеры с редактируемыми шаблонами.'},
   {name:'robots',content:'noindex, nofollow, noarchive'},
  ],
 }},
})
