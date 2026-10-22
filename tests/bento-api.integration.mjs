import {spawn} from 'node:child_process'
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
const server=spawn(process.execPath,['scripts/bento-api.mjs'],{env:{...process.env,BENTO_API_PORT:'3117'},stdio:['ignore','pipe','inherit']})
try{
 await new Promise((resolve,reject)=>{server.stdout.on('data',resolve);server.on('error',reject);server.on('exit',code=>reject(new Error('API exited '+code)))})
 const base='http://127.0.0.1:3117'
 const post=async(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
 const layouts=await(await fetch(base+'/api/layouts')).json();assert.equal(layouts.layouts.length,8)
 const request=JSON.parse(await readFile('examples/rental-request.json','utf8'))
 const created=await post('/api/bentos',request);assert.equal(created.status,200);let {project}=await created.json()
 const invalid=await post('/api/bentos',{data:{padding:0}});assert.equal(invalid.status,400)
 const sizes=[[1080,1080],[1080,1350],[1080,1920],[1200,628]]
 for(let format=0;format<4;format++){
  const changed=await post('/api/bentos/update',{project,patch:{format,data:{description:'подключаем водителей ежедневно'}}});assert.equal(changed.status,200);({project}=await changed.json())
  const response=await post('/api/bentos/render',{project});if(response.status!==200)throw Error(await response.text())
  const png=Buffer.from(await response.arrayBuffer());assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],sizes[format]);await writeFile(`examples/rental-${format}.png`,png)
 }
 console.log('Passed HTTP layout discovery, create/update, invalid request rejection, and 4 PNG render dimensions')
}finally{server.kill('SIGTERM')}
