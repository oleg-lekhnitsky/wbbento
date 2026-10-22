import test from 'node:test'
import assert from 'node:assert/strict'
import {captureFraming,applyFraming,framingScope} from '../lib/framing-defaults.mjs'
import {createProject} from '../lib/bento-project.mjs'
test('framing round trips independently per format without overwriting copy',()=>{
 const data=createProject({layout:'photo-bottom'}).data
 const a=framingScope(8,{w:1080,h:1080}),b=framingScope(8,{w:1080,h:1920})
 data.position=72;data.elementTransforms={[a]:{photo:{x:20,scale:1.3},website:{x:8}},[b]:{photo:{x:99}}}
 const saved=captureFraming(data,a)
 data.position=10;data.heading='Keep this copy';data.elementTransforms[a].photo.x=500
 applyFraming(data,a,saved)
 assert.equal(data.position,72);assert.equal(data.elementTransforms[a].photo.x,20)
 assert.equal(data.elementTransforms[b].photo.x,99);assert.equal(data.elementTransforms[a].website.x,8)
 assert.equal(data.heading,'Keep this copy')
})
