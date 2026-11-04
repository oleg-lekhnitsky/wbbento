const supported=new Set(['text','rect','rectangle','image','svg'])
const number=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?v:fallback
const normalized=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'').replace(/variable$/,'')
const rgb=c=>({r:number(c?.r,0),g:number(c?.g,0),b:number(c?.b,0)})
const alpha=c=>number(c?.a,1)
const paint=c=>c?[{type:'SOLID',color:rgb(c),opacity:alpha(c)}]:[]

export function validateSlide(input){
 if(!input || input.version!==1 || !Array.isArray(input.panels))throw Error('Choose a version 1 .figma.json slide export with a panels array.')
 const geometry=(node,label)=>{
  for(const key of ['width','height'])if(!Number.isFinite(node[key]) || node[key]<=0 || node[key]>100000)throw Error(`${label}: invalid ${key}.`)
  for(const key of ['x','y'])if(node[key]!==undefined && (!Number.isFinite(node[key]) || Math.abs(node[key])>1000000))throw Error(`${label}: invalid ${key}.`)
 }
 geometry(input,'Slide')
 let count=0
 for(const panel of input.panels){
  geometry(panel,'Panel')
  if(!Array.isArray(panel.layers))throw Error('Panel layers must be an array.')
  for(const layer of panel.layers){
   if(++count>10000)throw Error('Slide exceeds 10,000 layers.')
   if(!supported.has(layer.type))throw Error(`Unsupported layer type: ${layer.type}. Nothing has been imported.`)
   geometry(layer,layer.name||layer.type)
   if(layer.type==='text' && (typeof layer.text!=='string'||layer.text.length>100000))throw Error('Text layer contains invalid text.')
   if(layer.fontSize!==undefined && (!Number.isFinite(layer.fontSize)||layer.fontSize<=0||layer.fontSize>10000))throw Error('Invalid font size.')
   if(layer.type==='image')decodeImage(layer.dataUrl||layer.src||layer.image)
   if(layer.type==='svg' && (typeof layer.svg!=='string'||!layer.svg.trim().startsWith('<svg')))throw Error('SVG layers need an inline svg string.')
  }
 }
 return input
}

export function decodeImage(value){
 const match=typeof value==='string' && value.match(/^data:image\/(?:png|jpe?g|webp|gif);base64,([A-Za-z0-9+/\s]*={0,2})$/)
 if(!match)throw Error('Images must be embedded PNG, JPEG, WebP or GIF data URLs. Remote asset URLs are not downloaded.')
 const text=match[1].replace(/\s/g,''),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
 if(text.length%4!==0)throw Error('Invalid embedded image encoding.')
 const output=[];let bits=0,valueBits=0
 for(const char of text){if(char==='=')break;valueBits=(valueBits<<6)|alphabet.indexOf(char);bits+=6;if(bits>=8){bits-=8;output.push((valueBits>>bits)&255)}}
 if(!output.length)throw Error('Embedded image is empty.')
 return new Uint8Array(output)
}

// Join adjacent browser word spans, while keeping unrelated titles and logos separate.
export function mergeTextLayers(layers){
 const result=[]
 const signature=l=>JSON.stringify([l.name,l.font,l.fontSize,l.letterSpacing,l.lineHeight,l.color,l.opacity,l.armenian])
 for(const original of layers){
  const layer={...original},last=result.at(-1)
  if(layer.type==='text' && last?.type==='text' && signature(layer)===signature(last) && Math.abs(layer.y-last.y)<2 && !last.text.includes('\n') && layer.x>=last.x+last.width-2 && layer.x-last.x-last.width<layer.fontSize*.8){
   last.text=last.text.trimEnd()+' '+layer.text.trimStart();last.width=layer.x+layer.width-last.x;last.height=Math.max(last.height,layer.height)
  }else result.push(layer)
 }
 return result
}

export function styleWeight(style){
 const s=normalized(style)
 if(s.includes('thin'))return 100
 if(s.includes('extralight')||s.includes('ultralight'))return 200
 if(s.includes('light'))return 300
 if(s.includes('medium'))return 500
 if(s.includes('semibold')||s.includes('demibold'))return 600
 if(s.includes('extrabold')||s.includes('ultrabold'))return 800
 if(s.includes('black')||s.includes('heavy'))return 900
 if(s.includes('bold'))return 700
 return 400
}

export function chooseFont(layer,fonts){
 const requested=layer.font?.family||'Inter',weight=number(layer.font?.weight,400),italic=/italic|oblique/i.test(layer.font?.style||'')
 let candidates=fonts.map(f=>f.fontName||f).filter(f=>normalized(f.family)===normalized(requested))
 if(!candidates.length && normalized(requested)==='wbsans')candidates=fonts.map(f=>f.fontName||f).filter(f=>normalized(f.family)==='wbsanstest')
 const familyMatched=candidates.length>0
 if(!candidates.length)candidates=fonts.map(f=>f.fontName||f).filter(f=>normalized(f.family)==='inter')
 if(!candidates.length)throw Error(`No usable font for ${requested}. Make the original font or Inter available in Figma and retry.`)
 candidates.sort((a,b)=>{
  const score=f=>Math.abs(styleWeight(f.style)-weight)+(/italic|oblique/i.test(f.style)!==italic?1000:0)
  return score(a)-score(b)
 })
 return {fontName:{family:candidates[0].family,style:candidates[0].style},familyMatched,requested,weight}
}

export async function importSlide(api,input,options={}){
 const slide=validateSlide(input),fonts=await api.listAvailableFontsAsync(),warnings=new Set((slide.warnings||[]).map(String)),resolved=new Map()
 const getFont=async layer=>{
  const key=JSON.stringify(layer.font||{})
  if(resolved.has(key))return resolved.get(key)
  const selected=chooseFont(layer,fonts),font=selected.fontName
  await api.loadFontAsync(font)
  let axes=[]
  if(typeof api.getFontFamilyVariationAxes==='function')axes=api.getFontFamilyVariationAxes(font.family)||[]
  const requestedAxes={...(layer.font?.variations||{}),wght:selected.weight},variations={}
  for(const [tag,value]of Object.entries(requestedAxes))if(axes.includes(tag)&&Number.isFinite(value))variations[tag]=value
  const target=Object.keys(variations).length?{...font,variationSettings:variations}:font
  if(!selected.familyMatched)warnings.add(`Missing ${selected.requested}; substituted ${font.family} ${font.style}. Install the original font and reimport for matching typography.`)
  if(!axes.includes('wght') && styleWeight(font.style)!==selected.weight)warnings.add(`${selected.requested} weight ${selected.weight}: using ${font.family} ${font.style}.`)
  const missing=Object.keys(layer.font?.variations||{}).filter(tag=>!axes.includes(tag))
  if(missing.length)warnings.add(`${font.family}: unavailable variable axes ${missing.join(', ')}; text appearance may differ.`)
  resolved.set(key,target);return target
 }
 // Load fonts before creating any canvas nodes.
 for(const panel of slide.panels)for(const layer of panel.layers)if(layer.type==='text')await getFont(layer)
 let frame,reference,textCount=0,imageCount=0
 try{
  frame=api.createFrame();frame.name=slide.name||'Imported slide';frame.resize(slide.width,slide.height);frame.fills=[];frame.clipsContent=true
  const right=api.currentPage.children.filter(n=>n.id!==frame.id).reduce((max,n)=>Math.max(max,n.x+n.width),0)
  frame.x=right+120;frame.y=api.viewport.center.y-slide.height/2
  for(const panel of slide.panels){
   const container=api.createFrame();frame.appendChild(container);container.name=panel.name||'Panel';container.resize(panel.width,panel.height);container.x=number(panel.x,0);container.y=number(panel.y,0);container.fills=paint(panel.color);container.clipsContent=true
   const layers=options.mergeText===false?panel.layers:mergeTextLayers(panel.layers)
   for(const layer of layers){
    let node
    if(layer.type==='text'){
     node=api.createText();container.appendChild(node);node.fontName=await getFont(layer);node.fontSize=number(layer.fontSize,16);node.characters=layer.text
     node.letterSpacing={unit:'PIXELS',value:number(layer.letterSpacing,0)};node.lineHeight=Number.isFinite(layer.lineHeight)?{unit:'PIXELS',value:layer.lineHeight}:{unit:'AUTO'}
     node.textAlignHorizontal=['LEFT','CENTER','RIGHT','JUSTIFIED'].includes(String(layer.textAlign).toUpperCase())?String(layer.textAlign).toUpperCase():'LEFT'
     node.textAutoResize='HEIGHT';node.resize(layer.width,Math.max(1,layer.height));node.fills=paint(layer.color||{r:0,g:0,b:0,a:1});textCount++
     if(node.height>layer.height+2)warnings.add(`${layer.name||'Text'} reflowed taller than the export. Check the selected font and frame width.`)
    }else if(layer.type==='svg'){
     node=api.createNodeFromSvg(layer.svg);container.appendChild(node);node.rescale(layer.width/node.width)
     if(Math.abs(node.height-layer.height)>2)warnings.add(`${layer.name||'SVG'} kept its original aspect ratio.`)
    }else{
     node=api.createRectangle();container.appendChild(node);node.resize(layer.width,layer.height)
     if(layer.type==='image'){node.fills=[{type:'IMAGE',imageHash:api.createImage(decodeImage(layer.dataUrl||layer.src||layer.image)).hash,scaleMode:layer.fit==='contain'?'FIT':'FILL'}];imageCount++}
     else node.fills=paint(layer.color)
     node.cornerRadius=Math.max(0,Math.min(number(layer.radius,0),layer.width/2,layer.height/2))
    }
    node.name=layer.name||layer.type;node.x=number(layer.x,0);node.y=number(layer.y,0);node.opacity=Math.max(0,Math.min(1,number(layer.opacity,1)))
   }
  }
  frame.exportSettings=[{format:'PNG',constraint:{type:'SCALE',value:1},suffix:''}]
  if(options.reference && slide.referencePng){
   reference=api.createRectangle();reference.name=frame.name+' / Reference PNG';reference.resize(slide.width,slide.height);reference.x=frame.x+slide.width+80;reference.y=frame.y;reference.fills=[{type:'IMAGE',imageHash:api.createImage(decodeImage(slide.referencePng)).hash,scaleMode:'FIT'}]
  }
  api.currentPage.selection=[frame];api.viewport.scrollAndZoomIntoView(reference?[frame,reference]:[frame])
  return {frameId:frame.id,name:frame.name,textCount,imageCount,panels:slide.panels.length,warnings:[...warnings]}
 }catch(error){if(reference)reference.remove();if(frame)frame.remove();throw error}
}
