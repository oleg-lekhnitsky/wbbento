import { readFile,writeFile } from 'node:fs/promises'
import { listLayouts,createProject,updateProject,validateProject } from '../lib/bento-project.mjs'
const [command,inputPath,outputPath,patchPath]=process.argv.slice(2)
try{
 if(command==='layouts'){console.log(JSON.stringify(listLayouts(),null,2))}
 else{
  if(!inputPath||!outputPath)throw new Error('Usage: node scripts/bento.mjs create|update|render input.json output.json|png [patch.json]')
  const input=JSON.parse(await readFile(inputPath,'utf8'))
  if(command==='create')await writeFile(outputPath,JSON.stringify(createProject(input),null,2)+'\n')
  else if(command==='update'){if(!patchPath)throw new Error('Provide patch.json');await writeFile(outputPath,JSON.stringify(updateProject(input,JSON.parse(await readFile(patchPath,'utf8'))),null,2)+'\n')}
  else if(command==='render'){const {renderProject}=await import('../lib/render-project.mjs');await writeFile(outputPath,await renderProject(validateProject(input)))}
  else throw new Error('Unknown command')
  console.log(outputPath)
 }
}catch(error){console.error(error.message);process.exitCode=1}
