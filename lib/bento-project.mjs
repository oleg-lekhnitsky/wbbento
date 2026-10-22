import imagePlacements from '../data/figma-image-placements.json' with {type:'json'}
const initialPhoto=imagePlacements['3'].photo.defaultControls
export const defaults={carPrompt:{angle:'front-left',street:'boulevard',location:''},imagePrompt:{age:'',nationality:'',style:'relaxed'},benefitLabels:undefined,elementTransforms:{},partner:'DRIVER PRO',partnerCaption:'официальный\nпартнер',heading:'начните работать с wb taxi уже сегодня',description:'подключаем водителей. Каждый день 10:00–19:00',benefit:'ваш график.\nваши возможности.',city:'Ташкент',website:'driver-pro.uz',phone:'+998 90 981 77 73',accent:'#661AFF',image:'/assets/figma/driver-phone.png',logo:'',wbLogo:'/wb-taxi.svg',...initialPhoto,photoFit:'cover',vehicleScale:200,vehiclePosition:190,benefitLabel1:'физ лица',benefitLabel2:'ип',artwork:'/assets/figma/taxi-light.png',vehicleImage:'/assets/figma/taxi-side-right.png',storySafeTop:250,storySafeBottom:340,blockStyles:{headline:'purple'}}
export const formats=[{name:'Square post',ratio:'1:1',w:1080,h:1080},{name:'Portrait post',ratio:'4:5',w:1080,h:1350},{name:'Instagram Story',ratio:'9:16',w:1080,h:1920},{name:'Landscape',ratio:'1.91:1',w:1200,h:628}]
export const presets=['Driver introduction','Vehicle rental','Rental & driver','Start today','Driver recruitment','Photo & payments','Your own car','Rental offer']
export const presetCopy=[
 ['принимайте заказы wb taxi в свободное время','подключаем таксистов ежедневно 10:00–19:00',''],
 ['работайте в такси по своему графику','','даём автомобиль в аренду'],
 ['арендуйте авто и начните зарабатывать','','аренда от 150000 сом/день'],
 ['начните работать с wb taxi уже сегодня','','новые авто и гибкие тарифы'],
 ['подключаем водителей к wb taxi в Ташкенте','ежедневно 10:00–19:00','выплаты каждый день'],
 ['','','ежедневные выплаты водителям, выгодные условия'],
 ['зарабатывайте на своём автомобиле','','быстрое оформление документов'],
 ['начните зарабатывать с wb taxi','подключаем таксистов ежедневно 10:00–19:00','аренда авто\nот 150000\nсом/день']
]
const figmaAsset=(name)=>`/assets/figma/${name}.png`
export const presetAssets=[
 {image:figmaAsset('driver-purple'),artwork:'',vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-purple'),artwork:figmaAsset('keys'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-blue'),artwork:figmaAsset('taxi-light'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-phone'),artwork:figmaAsset('taxi-light'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-purple-phone'),artwork:figmaAsset('wallet'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driving-taxi'),artwork:figmaAsset('wallet'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-purple'),artwork:figmaAsset('taxi-light'),vehicleImage:figmaAsset('taxi-side-right')},
 {image:figmaAsset('driver-purple'),artwork:figmaAsset('taxi-light'),vehicleImage:figmaAsset('taxi-side-right')}
].map((assets,index)=>({...assets,position:50,positionY:50,photoZoom:100,...(imagePlacements[String(index)]?.photo?.defaultControls || {})}))
export function presetStyles(index){return [1,5,7].includes(index)?{benefit:'purple'}:{headline:'purple'}}

export const layoutIds=['driver-introduction','vehicle-rental','rental-driver','start-today','driver-recruitment','photo-payments','own-car','rental-offer']
export const formatIds=['square','portrait','story','landscape']
const copy=value=>JSON.parse(JSON.stringify(value))
const object=value=>value!==null && typeof value==='object' && !Array.isArray(value)
function requireObject(value,name){if(!object(value))throw new Error(`${name} must be an object`)}
function keys(value,allowed,name){for(const key of Object.keys(value))if(!allowed.includes(key))throw new Error(`Unknown ${name} field: ${key}`)}
function number(value,min,max,name){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`${name} must be a number from ${min} to ${max}`)}
function resolve(value,ids,names,name){const index=typeof value==='number'?value:ids.indexOf(value)>=0?ids.indexOf(value):names.indexOf(value);if(!Number.isInteger(index)||index<0||index>=ids.length)throw new Error(`Unknown ${name}: ${value}`);return index}
export function listLayouts(){return presets.map((name,index)=>({id:layoutIds[index],index,name,formats:formats.map((format,i)=>({id:formatIds[i],index:i,...format})),defaults:{...copy(presetAssets[index]),heading:presetCopy[index][0],description:presetCopy[index][1],benefit:presetCopy[index][2],blockStyles:presetStyles(index)}}))}
export function validateData(data){
 requireObject(data,'data');keys(data,Object.keys(defaults),'data')
 for(const [key,value] of Object.entries(data)){
  if(value===undefined && key==='benefitLabels')continue
  if(['image','logo','artwork','vehicleImage','wbLogo'].includes(key)){
   if(typeof value!=='string'||value.length>22*1024*1024||value && !/^\/(?:assets\/|wb-taxi[^/]*\.svg$)|^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))throw new Error(`${key} must be a local asset path or PNG/JPEG/WebP data URL`)
   if(value.includes('..')||value.includes('?')||value.includes('#'))throw new Error(`Invalid ${key} asset path`)
   if(key==='wbLogo' && value!=='/wb-taxi.svg')throw new Error('Official WB logo is protected')
  }else if(key==='blockStyles'){
   requireObject(value,key);keys(value,['headline','benefit','image','vehicle','partner'],key)
   for(const style of Object.values(value))if(!['default','purple','pink'].includes(style))throw new Error('Block colors must be default, purple or pink')
  }else if(key==='elementTransforms'){
   requireObject(value,key)
   for(const [scope,transforms] of Object.entries(value)){
    if(!/^([0-7]):(1080x1080|1080x1350|1080x1920|1200x628)$/.test(scope))throw new Error('Invalid transform scope')
    requireObject(transforms,'transforms');keys(transforms,['photo','artwork','vehicle'],'transforms')
    for(const t of Object.values(transforms)){requireObject(t,'transform');keys(t,['x','y','scale','rotation'],'transform');for(const k of ['x','y','scale','rotation'])if(t[k]!==undefined)number(t[k],k==='scale'?.1:-10000,k==='scale'?6:10000,k)}
   }
  }else if(key==='carPrompt'||key==='imagePrompt'){
   requireObject(value,key);keys(value,Object.keys(defaults[key]),key);for(const entry of Object.values(value))if(typeof entry!=='string'||entry.length>200)throw new Error(`Invalid ${key}`)
  }else if(key==='photoFit'){if(!['cover','contain'].includes(value))throw new Error('photoFit must be cover or contain')}
  else if(key==='accent'){if(!['#661AFF','#FF00FF','#202020'].includes(value))throw new Error('Use a brand accent color')}
  else if(typeof defaults[key]==='number'){
   const bounds={position:[0,100],positionY:[0,100],photoZoom:[100,300],vehicleScale:[50,260],vehiclePosition:[0,230],storySafeTop:[40,700],storySafeBottom:[40,700]}[key];number(value,...bounds,key)
  }else if(typeof value!=='string'||value.length>5000)throw new Error(`${key} must be text (up to 5000 characters)`)
 }
 return data
}
export function createProject(input={}){
 requireObject(input,'request');keys(input,['layout','format','data'],'request')
 const preset=resolve(input.layout??'start-today',layoutIds,presets,'layout')
 const format=resolve(input.format??'square',formatIds,formats.map(f=>f.name),'format')
 const overrides=copy(validateData(input.data??{}))
 const data={...copy(defaults),...copy(presetAssets[preset]),heading:presetCopy[preset][0],description:presetCopy[preset][1],benefit:presetCopy[preset][2],blockStyles:presetStyles(preset),benefitLabel1:preset===1?'комфорт':'физ лица',benefitLabel2:preset===1?'электро':'ип',...overrides,carPrompt:{...defaults.carPrompt,...overrides.carPrompt},imagePrompt:{...defaults.imagePrompt,...overrides.imagePrompt}}
 return {version:1,preset,format,data}
}
export function validateProject(project){
 requireObject(project,'project');keys(project,['version','preset','format','data'],'project')
 if(project.version!==1)throw new Error('Unsupported project version')
 resolve(project.preset,layoutIds,presets,'layout');resolve(project.format,formatIds,formats.map(f=>f.name),'format');validateData(project.data)
 return createProject({layout:project.preset,format:project.format,data:project.data})
}
export function assetPlacementReset(data,key){
 const transformKey={image:'photo',artwork:'artwork',vehicleImage:'vehicle'}[key]
 if(!transformKey)return {}
 const elementTransforms=Object.fromEntries(Object.entries(data.elementTransforms??{}).map(([scope,items])=>[scope,Object.fromEntries(Object.entries(items).filter(([name])=>name!==transformKey))]))
 return {elementTransforms,...(key==='image'?{position:50,positionY:50,photoZoom:100,photoFit:'cover'}:key==='vehicleImage'?{vehicleScale:200,vehiclePosition:190}:{})}
}
export function updateProject(project,patch){
 const previous=validateProject(project);requireObject(patch,'patch');keys(patch,['layout','format','data'],'patch');validateData(patch.data??{})
 for(const key of ['image','artwork','vehicleImage'])if(patch.data?.[key]!==undefined && patch.data[key]!==previous.data[key])Object.assign(previous.data,assetPlacementReset(previous.data,key))
 const transforms=copy(previous.data.elementTransforms)
 for(const [scope,items] of Object.entries(patch.data?.elementTransforms??{})){
  transforms[scope]={...transforms[scope]}
  for(const [key,value] of Object.entries(items))transforms[scope][key]={...transforms[scope][key],...value}
 }
 return createProject({layout:patch.layout??previous.preset,format:patch.format??previous.format,data:{...previous.data,...patch.data,blockStyles:{...previous.data.blockStyles,...patch.data?.blockStyles},elementTransforms:transforms,carPrompt:{...previous.data.carPrompt,...patch.data?.carPrompt},imagePrompt:{...previous.data.imagePrompt,...patch.data?.imagePrompt}}})
}
