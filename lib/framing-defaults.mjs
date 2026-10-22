// Framing is independent for every template and output size.
const fields=['image','artwork','vehicleImage','position','positionY','photoZoom','photoFit','vehicleScale','vehiclePosition']
export const framingScope=(preset,format)=>`${preset}:${format.w}x${format.h}`
export function captureFraming(data,scope){
 const result=Object.fromEntries(fields.filter(key=>data[key]!==undefined).map(key=>[key,data[key]]))
 result.transforms=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(data.elementTransforms?.[scope]||{}).filter(([key])=>['photo','artwork','vehicle'].includes(key)))))
 return result
}
export function applyFraming(data,scope,framing){
 if(!framing)return
 for(const key of fields)if(framing[key]!==undefined)data[key]=framing[key]
 const existing={...data.elementTransforms?.[scope]}
 for(const key of ['photo','artwork','vehicle'])delete existing[key]
 data.elementTransforms={...data.elementTransforms,[scope]:{...existing,...JSON.parse(JSON.stringify(framing.transforms||{}))}}
}
