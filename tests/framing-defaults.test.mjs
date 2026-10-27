import test from 'node:test'
import assert from 'node:assert/strict'
import {captureFraming,applyFraming,framingScope,templateDefaultsFromFramings,applyTemplateFraming} from '../lib/framing-defaults.mjs'
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

test('a replacement photo applies to every size without reusing another photo crop',()=>{
 const square='0:1080x1080',story='0:1080x1920'
 const framings={
  [square]:{image:'/assets/new.png',position:72,transforms:{photo:{scale:1.3}}},
  [story]:{image:'/assets/old.png',position:10,photoZoom:180,transforms:{photo:{scale:2},artwork:{x:12}}}
 }
 const {photos}=templateDefaultsFromFramings(framings,[{image:'/assets/old.png'}])
 const data=createProject({layout:0}).data
 applyTemplateFraming(data,square,framings[square],photos[0])
 assert.equal(data.image,'/assets/new.png');assert.equal(data.position,72)
 assert.equal(data.elementTransforms[square].photo.scale,1.3)
 applyTemplateFraming(data,story,framings[story],photos[0])
 assert.equal(data.image,'/assets/new.png');assert.equal(data.position,50);assert.equal(data.photoZoom,100)
 assert.equal(data.elementTransforms[story].photo,undefined)
 assert.equal(data.elementTransforms[story].artwork.x,12)
 assert.equal(data.elementTransforms[square].photo.scale,1.3)
})

test('a replacement saved in widescreen also becomes the template photo',()=>{
 const {photos}=templateDefaultsFromFramings({'0:1080x1080':{image:'/assets/old.png'},'0:1920x1080':{image:'/assets/new.png'}},[{image:'/assets/old.png'}])
 assert.equal(photos[0],'/assets/new.png')
})
