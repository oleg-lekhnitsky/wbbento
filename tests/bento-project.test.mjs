import test from 'node:test'
import assert from 'node:assert/strict'
import {createProject,updateProject,validateProject,listLayouts} from '../lib/bento-project.mjs'
test('all exact layouts and formats create independent editable projects',()=>{
 const layouts=listLayouts();assert.equal(layouts.length,8)
 for(const layout of layouts)for(const format of layout.formats){const p=createProject({layout:layout.id,format:format.id});assert.equal(p.preset,layout.index);assert.equal(p.format,format.index);assert.deepEqual(validateProject(p),p)}
 const a=createProject(),b=createProject();a.data.blockStyles.headline='pink';assert.equal(b.data.blockStyles.headline,'purple')
})
test('content, labels and format-scoped image placement survive updates',()=>{
 const a=createProject({layout:'rental-offer',data:{benefitLabels:'one\ntwo\nthree',elementTransforms:{'7:1080x1080':{vehicle:{x:5,y:0,scale:1.2,rotation:15}}}}})
 const b=updateProject(a,{format:'landscape',data:{heading:'новый заголовок',blockStyles:{benefit:'pink'}}})
 assert.equal(b.format,3);assert.equal(b.data.benefitLabels,'one\ntwo\nthree');assert.equal(b.data.heading,'новый заголовок');assert.equal(b.data.elementTransforms['7:1080x1080'].vehicle.rotation,15);assert.equal(a.data.blockStyles.benefit,'purple')
})
test('rejects unsupported geometry, locked text transforms and unsafe assets',()=>{
 for(const request of [{layout:8},{format:'banner'},{fontSize:80},{data:{heading:7}},{data:{padding:0}},{data:{accent:'#123456'}},{data:{position:101}},{data:{photoZoom:'150'}},{data:{wbLogo:'/assets/custom.svg'}},{data:{image:'https://example.com/photo.png'}},{data:{image:'/assets/../private.png'}},{data:{elementTransforms:{'3:1080x1080':{website:{x:10}}}}}])assert.throws(()=>createProject(request))
 assert.throws(()=>validateProject({...createProject(),version:2}))
})
test('local asset and clipboard image inputs are accepted; unknown patches are rejected',()=>{
 assert.equal(createProject({data:{image:'data:image/png;base64,YQ=='}}).data.image,'data:image/png;base64,YQ==')
 assert.throws(()=>updateProject(createProject(),{data:{blockStyles:{canvas:'pink'}}}))
 assert.throws(()=>updateProject(createProject(),{geometry:{width:1}}))
})
test('partial nested updates preserve other settings and do not alias input objects',()=>{
 const input={data:{carPrompt:{angle:'rear-left'},elementTransforms:{'3:1080x1080':{artwork:{x:20,scale:1.5},photo:{rotation:5}}}}}
 const a=createProject(input);input.data.carPrompt.angle='rear-right';assert.equal(a.data.carPrompt.angle,'rear-left');assert.equal(a.data.carPrompt.location,'')
 const b=updateProject(a,{data:{elementTransforms:{'3:1080x1080':{artwork:{rotation:15}}}}})
 assert.equal(b.data.elementTransforms['3:1080x1080'].artwork.scale,1.5);assert.equal(b.data.elementTransforms['3:1080x1080'].photo.rotation,5)
})
test('replacing an image resets its crop and transforms in every format, retaining other assets',()=>{
 const p=createProject({data:{photoZoom:220,position:81,elementTransforms:{'3:1080x1080':{photo:{scale:3},artwork:{rotation:20}},'3:1200x628':{photo:{x:50}}}}})
 const next=updateProject(p,{data:{image:'/assets/figma/driver-blue.png'}})
 assert.equal(next.data.photoZoom,100);assert.equal(next.data.position,50);assert.equal(next.data.elementTransforms['3:1080x1080'].photo,undefined);assert.equal(next.data.elementTransforms['3:1200x628'].photo,undefined);assert.equal(next.data.elementTransforms['3:1080x1080'].artwork.rotation,20)
 assert.equal(p.data.photoZoom,220)
})
