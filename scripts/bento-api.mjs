import http from 'node:http'
import createSchema from '../schemas/create-bento.schema.json' with {type:'json'}
import projectSchema from '../schemas/bento-project.schema.json' with {type:'json'}
import { listLayouts,createProject,updateProject,validateProject } from '../lib/bento-project.mjs'
import { renderProject } from '../lib/render-project.mjs'
const port=Number(process.env.BENTO_API_PORT||3110)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid BENTO_API_PORT')
let rendering=Promise.resolve()
function json(response,status,value){response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(value))}
const server=http.createServer(async(request,response)=>{
 try{
  if(request.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(request.headers.origin)){json(response,403,{error:'Local clients only'});return}
  if(request.method==='GET'&&request.url==='/api/schema'){json(response,200,{create:createSchema,project:projectSchema});return}
  if(request.method==='GET'&&request.url==='/api/layouts'){json(response,200,{layouts:listLayouts()});return}
  const paths=['/api/bentos','/api/bentos/update','/api/bentos/render']
  if(request.method!=='POST'||!paths.includes(request.url)){json(response,404,{error:'Not found'});return}
  if(!request.headers['content-type']?.startsWith('application/json')){json(response,415,{error:'Use application/json'});return}
  const chunks=[];let size=0
  for await(const chunk of request){size+=chunk.length;if(size>24*1024*1024){json(response,413,{error:'Request too large'});return}chunks.push(chunk)}
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if(request.url==='/api/bentos'){json(response,200,{project:createProject(input)});return}
  if(request.url==='/api/bentos/update'){json(response,200,{project:updateProject(input.project,input.patch)});return}
  const project=validateProject(input.project)
  const pending=rendering.then(()=>renderProject(project));rendering=pending.catch(()=>{})
  const png=await pending
  response.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});response.end(png)
 }catch(error){json(response,400,{error:error.message})}
})
server.listen(port,'127.0.0.1',()=>console.log(`WB Bento local API: http://127.0.0.1:${port}`))
