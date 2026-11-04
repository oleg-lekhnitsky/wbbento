export async function copyReferenceImage(src:string){
 if(!window.isSecureContext)throw new Error('Копирование изображений доступно только через HTTPS или localhost. Скачайте референс ниже.')
 if(typeof ClipboardItem==='undefined' || !navigator.clipboard?.write)throw new Error('Этот браузер не поддерживает копирование изображений. Скачайте референс ниже.')
 // Start the clipboard write during the click's user activation (Safari).
 const png=fetch(src).then(async response=>{
  if(!response.ok)throw new Error('Не удалось загрузить референс. Попробуйте скачать его ниже.')
  const blob=await response.blob()
  if(blob.type==='image/png')return blob
  const url=URL.createObjectURL(blob)
  try{
   const image=new Image();image.src=url;await image.decode()
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
   const context=canvas.getContext('2d');if(!context)throw new Error('Image conversion unavailable')
   context.drawImage(image,0,0)
   return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Image conversion failed')),'image/png'))
  }finally{URL.revokeObjectURL(url)}
 })
 // A permission failure can happen before the download finishes.
 void png.catch(()=>{})
 try{await navigator.clipboard.write([new ClipboardItem({'image/png':png})])}
 catch(error){
  if(error instanceof DOMException && error.name==='NotAllowedError')throw new Error('Браузер запретил доступ к буферу обмена. Разрешите его в настройках сайта или скачайте референс ниже.')
  if(error instanceof DOMException && error.name==='DataError')throw new Error('Браузер не смог скопировать изображение в буфер обмена. Скачайте референс ниже.')
  throw error
 }
}
