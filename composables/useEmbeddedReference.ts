/** Encode a compact visual reference locally; no remote service is involved. */
export async function embedReferenceImage(src:string){
 const response=await fetch(src)
 if(!response.ok)throw new Error('Could not load the selected reference image.')
 const objectUrl=URL.createObjectURL(await response.blob())
 try{
  const image=new Image();image.src=objectUrl;await image.decode()
  const ratio=Math.min(1,768/Math.max(image.naturalWidth,image.naturalHeight))
  const canvas=document.createElement('canvas')
  canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio))
  const context=canvas.getContext('2d');if(!context)throw new Error('Could not prepare the reference image.')
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height)
  return canvas.toDataURL('image/jpeg',.78)
 }finally{URL.revokeObjectURL(objectUrl)}
}
