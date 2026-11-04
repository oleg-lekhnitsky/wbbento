figma.showUI(__html__,{width:400,height:520,themeColors:true})
let importing=false
figma.ui.onmessage=async message=>{
 if(message.type==='close'){figma.closePlugin();return}
 if(message.type!=='import'||importing)return
 importing=true
 try{
  const result=await importSlide(figma,message.document,message.options)
  figma.ui.postMessage({type:'success',result})
 }catch(error){figma.ui.postMessage({type:'error',message:error instanceof Error?error.message:String(error)})}
 finally{importing=false}
}
