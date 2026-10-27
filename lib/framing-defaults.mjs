// Framing is independent for every template and output size.
const fields=['blockStyles','image','artwork','vehicleImage','position','positionY','photoZoom','photoFit','vehicleScale','vehiclePosition']
export const framingScope=(preset,format)=>`${preset}:${format.w}x${format.h}`
export function captureFraming(data,scope){
 const result=Object.fromEntries(fields.filter(key=>data[key]!==undefined).map(key=>[key,data[key]]))
 result.transforms=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(data.elementTransforms?.[scope]||{}).filter(([key])=>['photo','artwork','vehicle'].includes(key)))))
 return JSON.parse(JSON.stringify(result))
}
export function applyFraming(data,scope,framing){
 if(!framing)return
 for(const key of fields)if(framing[key]!==undefined)data[key]=JSON.parse(JSON.stringify(framing[key]))
 const existing={...data.elementTransforms?.[scope]}
 for(const key of ['photo','artwork','vehicle'])delete existing[key]
 data.elementTransforms={...data.elementTransforms,[scope]:{...existing,...JSON.parse(JSON.stringify(framing.transforms||{}))}}
}

// Older exports stored template photos alongside size-specific crops.
// Recover replacements even when only one size was saved with the new photo.
export function templateDefaultsFromFramings(framings,baseAssets){
 const photos={},styles={}
 for(const [preset,base] of baseAssets.entries()){
  const entries=Object.entries(framings).filter(([scope])=>scope.startsWith(`${preset}:`))
  const changed=entries.filter(([,value])=>value.image!==undefined && value.image!==base.image)
  const photo=changed.find(([scope])=>scope.endsWith(':1080x1080')) || changed.at(-1) || entries.find(([,value])=>value.image!==undefined)
  if(photo)photos[preset]=photo[1].image
  const style=entries.find(([scope,value])=>scope.endsWith(':1080x1080') && value.blockStyles!==undefined) || entries.find(([,value])=>value.blockStyles!==undefined)
  if(style)styles[preset]=JSON.parse(JSON.stringify(style[1].blockStyles))
 }
 return {photos,styles}
}

export function applyTemplateFraming(data,scope,framing,photo,styles){
 const cropImage=framing?.image ?? data.image
 applyFraming(data,scope,framing)
 if(photo!==undefined){
  if(cropImage!==photo){
   Object.assign(data,{position:50,positionY:50,photoZoom:100,photoFit:'cover'})
   const transforms={...data.elementTransforms?.[scope]};delete transforms.photo
   data.elementTransforms={...data.elementTransforms,[scope]:transforms}
  }
  data.image=photo
 }
 if(styles!==undefined)data.blockStyles=JSON.parse(JSON.stringify(styles))
}
