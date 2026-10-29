<script setup lang="ts">
import {DialogRoot,DialogPortal,DialogOverlay,DialogContent,DialogTitle,DialogDescription} from 'reka-ui'
import {onboardingTypography} from '~/lib/russian-typography.mjs'
import {onboardingPosition} from '~/lib/onboarding-position.mjs'
import {Button as UiButton} from '~/components/ui/button'
import {ArrowLeft,ArrowRight,Check,X} from '@lucide/vue'

const emit=defineEmits<{selectBlock:[key:string]}>()
const seen=useCookie<string | null>('wb-bento-onboarding-v1',{maxAge:60*60*24*365,sameSite:'lax',path:'/'})
const opened=ref(false),step=ref(0)
const steps=[
 {title:'Ваш первый баннер',text:'Выберите шаблон, добавьте свои тексты и фото — и скачайте готовый баннер. Покажем, где всё находится.',target:''},
 {title:'Выберите шаблон',text:'Слева — готовые композиции. Выберите баннер с фото на весь кадр или шаблон с отдельными блоками.',target:'[data-onboarding="templates"]'},
 {title:'Задайте формат',text:'Выберите размер для публикации: квадрат, пост, сторис или горизонтальный баннер. Шаблон адаптируется, а выбранное фото сохранится.',target:'[data-onboarding="format"]'},
 {title:'Пишите прямо на баннере',text:'Нажмите на заголовок или другой текст на баннере и начните печатать. Изменения сразу появятся в макете и в полях справа.',target:'.artboard .tile.headline, .artboard .tile.benefit',block:'headline'},
 {title:'Или используйте панель',text:'Тот же текст можно изменить в полях справа. Выберите нужный блок на баннере или в списке над полями — оба способа редактируют один и тот же текст.',target:'[data-onboarding="settings"]',block:'headline'},
 {title:'Добавьте свой логотип',text:'Здесь можно указать название партнёра или загрузить свой логотип в SVG, PNG или WebP. Он появится на баннере вместо текстового названия партнёра.',target:'[data-onboarding="partner-logo"]',block:'headline'},
 {title:'Подберите фото',text:'В разделе «Фото» выберите готовый снимок или загрузите свой. Перетаскивайте фото на баннере, чтобы настроить кадрирование для каждого размера.',target:'[data-onboarding="photos"]',block:'image'},
 {title:'Создайте фото по образцу',text:'Хотите другое фото? Выберите образец водителя или автомобиля и задайте параметры съёмки. Скопируйте образец и готовый промпт в генератор изображений, а полученный снимок загрузите в баннер.',target:'[data-onboarding="photo-generation"]',block:'image',optional:true},
 {title:'Создайте с ChatGPT',text:'Баннер можно подготовить с помощью ChatGPT. Укажите, что хотите изменить, и скопируйте готовый промпт в чат. Полученный JSON вставьте обратно в студию — изменения появятся на баннере.',target:'[data-onboarding="chatgpt"]',optional:true},
 {title:'Для работы в других редакторах',text:'Работаете в Figma или другом редакторе? В разделе «Материалы» можно скачать шрифты и блоки официального партнёра для своих макетов.',target:'[data-onboarding="materials"]',optional:true},
 {title:'Скачайте готовый баннер',text:'Нажмите «Экспорт PNG», чтобы скачать изображение. «Сохранить проект» сохранит редактируемый баннер в этом браузере.',target:'[data-onboarding="export"]'},
 {title:'Подсказки всегда под рукой',text:'Чтобы пройти обучение ещё раз, нажмите на значок вопроса в верхней панели. Здесь можно в любой момент вспомнить, как создать и настроить баннер.',target:'[data-onboarding="help"]'},
].map(item=>({...item,title:onboardingTypography(item.title),text:onboardingTypography(item.text)}))
const current=computed(()=>steps[step.value])
const spotlight=ref<{left:number;top:number;width:number;height:number} | null>(null)
const cardBody=ref<HTMLElement>()
const placement=ref<ReturnType<typeof onboardingPosition> | null>(null)
const cardStyle=computed(()=>placement.value?{left:placement.value.x+'px',top:placement.value.y+'px',right:'auto',bottom:'auto',transform:'none'}:{})
const arrowStyle=computed(()=>{const p=placement.value;if(!p)return {};return p.side==='left'?{right:'0px',top:p.arrowY+'px'}:p.side==='right'?{left:'0px',top:p.arrowY+'px'}:p.side==='top'?{bottom:'0px',left:p.arrowX+'px'}:{top:'0px',left:p.arrowX+'px'}})
let frame=0,observer:ResizeObserver | undefined
function findTarget(){return current.value.target?Array.from(document.querySelectorAll<HTMLElement>(current.value.target)).find(el=>{const rect=el.getBoundingClientRect();return rect.width>0 && rect.height>0}):undefined}
function measure(){
 const target=findTarget()
 if(!opened.value || !target){spotlight.value=null;placement.value=null;return}
 const rect=target.getBoundingClientRect(),pad=6
 const left=Math.max(8,rect.left-pad),top=Math.max(8,rect.top-pad)
 const right=Math.min(window.innerWidth-8,rect.right+pad),bottom=Math.min(window.innerHeight-8,rect.bottom+pad)
 spotlight.value=right>left && bottom>top?{left,top,width:right-left,height:bottom-top}:null
 const card=cardBody.value?.parentElement
 placement.value=card && spotlight.value?onboardingPosition(spotlight.value,card.getBoundingClientRect(),{width:window.innerWidth,height:window.innerHeight}):null
}
function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
async function showStep(){
 spotlight.value=null;placement.value=null;observer?.disconnect()
 if(!opened.value)return
 if(current.value.block)emit('selectBlock',current.value.block)
 await nextTick()
 const target=findTarget()
 target?.scrollIntoView({block:'nearest',inline:'nearest'})
 if(target)observer?.observe(target)
 if(cardBody.value)observer?.observe(cardBody.value)
 schedule()
}
function start(){step.value=0;opened.value=true}
function dismiss(){seen.value='dismissed';opened.value=false;spotlight.value=null}
function next(){if(step.value<steps.length-1)step.value++;else{seen.value='completed';opened.value=false;spotlight.value=null}}
function setOpen(value:boolean){if(!value)dismiss()}
watch([opened,step],showStep)
onMounted(()=>{
 observer=new ResizeObserver(schedule)
 if(!seen.value)start()
 window.addEventListener('resize',schedule)
 window.addEventListener('scroll',schedule,true)
})
onBeforeUnmount(()=>{observer?.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true)})
defineExpose({start})
</script>

<template>
 <DialogRoot :open="opened" @update:open="setOpen">
  <DialogPortal>
   <DialogOverlay class="onboarding-overlay" :class="{'has-target':spotlight}"/>
   <div v-if="spotlight" class="onboarding-spotlight" :style="{left:spotlight.left+'px',top:spotlight.top+'px',width:spotlight.width+'px',height:spotlight.height+'px'}" aria-hidden="true"/>
   <DialogContent class="onboarding-card" :class="{'onboarding-welcome':!placement}" :style="cardStyle" @escape-key-down.prevent="dismiss" @pointer-down-outside.prevent>
    <div v-if="placement?.arrow" class="onboarding-arrow" :class="'points-'+placement.side" :style="arrowStyle" aria-hidden="true"/>
    <div ref="cardBody" class="onboarding-body">
    <div class="onboarding-top">
     <div class="onboarding-progress" role="status" aria-live="polite">{{step+1}} из {{steps.length}}<span v-if="current.optional"> · Необязательно</span></div>
     <UiButton variant="ghost" size="icon-sm" aria-label="Закрыть обучение" @click="dismiss"><X class="size-4"/></UiButton>
    </div>
    <DialogTitle class="onboarding-title">{{current.title}}</DialogTitle>
    <DialogDescription class="onboarding-description">{{current.text}}</DialogDescription>
    <div class="onboarding-dots" aria-hidden="true"><span v-for="(_,index) in steps" :key="index" :class="{active:index===step,done:index<step}"/></div>
    <div class="onboarding-actions">
     <UiButton v-if="step===0" variant="ghost" size="sm" @click="dismiss">Пропустить</UiButton>
     <UiButton v-else variant="outline" @click="step--"><ArrowLeft class="size-4"/>Назад</UiButton>
     <UiButton @click="next">{{step===0?'Показать':step===steps.length-1?'Создать баннер':'Далее'}}<Check v-if="step===steps.length-1" class="size-4"/><ArrowRight v-else class="size-4"/></UiButton>
    </div>
    </div>
   </DialogContent>
  </DialogPortal>
 </DialogRoot>
</template>

<style scoped>
.onboarding-overlay{position:fixed;inset:0;z-index:90;background:rgb(0 0 0 / .48)}
.onboarding-overlay.has-target{background:transparent}
.onboarding-spotlight{position:fixed;z-index:91;pointer-events:none;border-radius:14px;outline:2px solid #a875ff;box-shadow:0 0 0 9999px rgb(0 0 0 / .48)}
.onboarding-card{position:fixed;z-index:92;right:24px;bottom:24px;width:min(380px,calc(100vw - 32px));max-height:calc(100dvh - 32px);background:var(--popover);color:var(--popover-foreground);border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 4px 6px -1px #0000001a,0 2px 4px -2px #0000001a;outline:none;font-family:var(--font-sans)}
.onboarding-welcome{right:50%;bottom:50%;transform:translate(50%,50%);width:min(420px,calc(100vw - 32px))}
.onboarding-body{max-height:calc(100dvh - 64px);overflow-y:auto}
.onboarding-arrow{position:absolute;width:14px;height:14px;background:var(--popover);border:1px solid var(--border);transform:translate(-50%,-50%) rotate(45deg);pointer-events:none}
.onboarding-arrow.points-right{transform:translate(-50%,-50%) rotate(45deg);border-top:0;border-right:0}
.onboarding-arrow.points-left{transform:translate(50%,-50%) rotate(45deg);border-bottom:0;border-left:0}
.onboarding-arrow.points-bottom{transform:translate(-50%,-50%) rotate(45deg);border-bottom:0;border-right:0}
.onboarding-arrow.points-top{transform:translate(-50%,50%) rotate(45deg);border-top:0;border-left:0}
.onboarding-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.onboarding-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}
.onboarding-progress{font-size:12px;color:var(--muted-foreground);margin:0;font-variant-numeric:tabular-nums}
.onboarding-title{font-size:18px;line-height:1.35;letter-spacing:-.025em;font-weight:600;margin:0 0 8px}
.onboarding-description{font-size:14px;line-height:1.5;color:var(--muted-foreground);margin:0}
.onboarding-title,.onboarding-description{text-wrap:balance}
.onboarding-dots{display:flex;gap:4px;margin:16px 0}
.onboarding-dots span{height:3px;flex:1;border-radius:var(--radius);background:var(--muted)}
.onboarding-dots span.active{background:var(--primary)}.onboarding-dots span.done{background:var(--muted-foreground)}
.onboarding-actions{padding-top:8px}
@media(max-width:850px){.onboarding-card:not(.onboarding-welcome){right:16px;bottom:16px;padding:16px}}
</style>
