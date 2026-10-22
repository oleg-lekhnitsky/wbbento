export async function copyReferenceImage(src:string){
 if(typeof ClipboardItem==='undefined' || !navigator.clipboard?.write)throw new Error('Image clipboard unavailable')
 const response=await fetch(src)
 if(!response.ok)throw new Error('Reference unavailable')
 await navigator.clipboard.write([new ClipboardItem({'image/png':await response.blob()})])
}
