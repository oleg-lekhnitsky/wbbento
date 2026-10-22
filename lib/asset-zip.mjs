// Store already-compressed PNGs without adding a browser ZIP dependency.
export function assetZip(files){
 const encoder=new TextEncoder(),parts=[],directory=[];let offset=0
 const header=(size)=>{const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)}}
 for(const {name,data} of files){
  const filename=encoder.encode(name);let crc=0xffffffff
  for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
  crc=(crc^0xffffffff)>>>0
  const local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,data.length,true);local.view.setUint32(22,data.length,true);local.view.setUint16(26,filename.length,true)
  parts.push(local.bytes,filename,data)
  const central=header(46);central.view.setUint32(0,0x02014b50,true);central.view.setUint16(4,20,true);central.view.setUint16(6,20,true);central.view.setUint16(8,0x800,true);central.view.setUint32(16,crc,true);central.view.setUint32(20,data.length,true);central.view.setUint32(24,data.length,true);central.view.setUint16(28,filename.length,true);central.view.setUint32(42,offset,true)
  directory.push(central.bytes,filename);offset+=30+filename.length+data.length
 }
 const directorySize=directory.reduce((size,part)=>size+part.length,0),end=header(22)
 end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,directorySize,true);end.view.setUint32(16,offset,true)
 return new Blob([...parts,...directory,end.bytes],{type:'application/zip'})
}
