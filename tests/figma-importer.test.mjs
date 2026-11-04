import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import vm from 'node:vm'
import {validateSlide,mergeTextLayers,chooseFont,decodeImage,importSlide} from '../figma-importer/core.mjs'

const text=(value,x=20)=>({type:'text',name:'Headline',text:value,x,y:30,width:100,height:48,font:{family:'WBSans',weight:500,style:'normal',variations:{}},fontSize:40,letterSpacing:-1,lineHeight:48,color:{r:1,g:1,b:1,a:1},opacity:1})
const fixture=()=>({version:1,name:'Slide 1',width:1080,height:1350,panels:[{name:'First panel',x:0,y:0,width:1080,height:675,color:{r:1,g:0,b:1,a:1},layers:[text('Left',20),text('slide',130),text('1',240)]},{name:'Second panel',x:0,y:675,width:1080,height:675,color:{r:.5,g:.2,b:.9,a:1},layers:[{...text('Legal'),name:'Legal',y:608,opacity:.72}]}],referencePng:'data:image/png;base64,iVBORw0KGgo='})
const fonts=[{fontName:{family:'WB Sans',style:'Medium'}},{fontName:{family:'Inter',style:'Regular'}},{fontName:{family:'Inter',style:'Extra Bold'}}]
function mockApi({failOnImage=false,failFont=false}={}){
 let id=0;const loaded=new Set(),created=[]
 const page={children:[],selection:[]}
 const api={currentPage:page,viewport:{center:{x:0,y:0},scrollAndZoomIntoView(nodes){this.shown=nodes}},listAvailableFontsAsync:async()=>fonts,loadFontAsync:async f=>{if(failFont)throw Error('Font load failed');loaded.add(f.family+' '+f.style)},getFontFamilyVariationAxes:family=>family==='Inter'?['wght']:null}
 const make=type=>{
  const node={id:String(++id),type,width:100,height:100,x:0,y:0,children:[],parent:page,removed:false,appendChild(child){child.parent.children.splice(child.parent.children.indexOf(child),1);child.parent=this;this.children.push(child)},resize(w,h){this.width=w;this.height=h},remove(){this.removed=true;this.parent.children.splice(this.parent.children.indexOf(this),1)}}
  if(type==='TEXT')Object.defineProperty(node,'characters',{get(){return this._text},set(value){assert.ok(loaded.has(this.fontName.family+' '+this.fontName.style),'Font must load before text editing');this._text=value}})
  page.children.push(node);created.push(node);return node
 }
 api.createFrame=()=>make('FRAME');api.createText=()=>make('TEXT');api.createRectangle=()=>make('RECTANGLE')
 api.createImage=bytes=>{if(failOnImage)throw Error('Invalid image');assert.ok(bytes instanceof Uint8Array);return {hash:'image-hash'}}
 api.created=created;return api
}

test('imports editable text with panel-relative coordinates, colors and opacity',async()=>{
 const api=mockApi(),input=fixture(),before=JSON.stringify(input)
 const result=await importSlide(api,input)
 assert.equal(result.textCount,2);assert.equal(result.panels,2)
 const frame=api.currentPage.children[0]
 assert.equal(frame.width,1080);assert.equal(frame.height,1350)
 assert.deepEqual(frame.children[0].fills,[{type:'SOLID',color:{r:1,g:0,b:1},opacity:1}])
 assert.equal(frame.children[0].children[0].characters,'Left slide 1')
 assert.equal(frame.children[0].children[0].fontName.family,'WB Sans')
 assert.equal(frame.children[1].y,675);assert.equal(frame.children[1].children[0].y,608);assert.equal(frame.children[1].children[0].opacity,.72)
 assert.equal(api.currentPage.selection[0],frame)
 assert.equal(JSON.stringify(input),before)
})
test('word merging can be disabled and does not combine different fonts, lines or labels',async()=>{
 const api=mockApi();assert.equal((await importSlide(api,fixture(),{mergeText:false})).textCount,4)
 assert.equal(mergeTextLayers([text('One'),{...text('Two',130),y:100}]).length,2)
 assert.equal(mergeTextLayers([text('One'),{...text('Two',130),name:'Another title'}]).length,2)
 assert.equal(mergeTextLayers([text('One'),{...text('Two',130),fontSize:20}]).length,2)
})
test('font aliases, nearest weights and explicit fallback warnings',async()=>{
 assert.equal(chooseFont({...text('Test'),font:{family:'InterVariable',weight:850}},fonts).fontName.style,'Extra Bold')
 const doc=fixture();doc.panels[0].layers[0].font.family='Missing Font'
 const result=await importSlide(mockApi(),doc)
 assert.ok(result.warnings.some(w=>w.includes('Missing Font')&&w.includes('Inter')))
})
test('variable font axes are preserved where available',async()=>{
 const doc=fixture();doc.panels[0].layers=[{...text('Variable'),font:{family:'InterVariable',weight:550,variations:{wght:550,wdth:25}}}]
 const api=mockApi(),result=await importSlide(api,doc)
 assert.deepEqual(api.currentPage.children[0].children[0].children[0].fontName.variationSettings,{wght:550})
 assert.ok(result.warnings.some(w=>w.includes('wdth')))
})
test('optional preview is separate from the editable frame',async()=>{
 const api=mockApi();await importSlide(api,fixture(),{reference:true})
 assert.equal(api.currentPage.children.length,2)
 assert.equal(api.currentPage.children[0].type,'FRAME');assert.equal(api.currentPage.children[1].type,'RECTANGLE')
})
test('unsupported layers and malformed geometry fail before mutating the canvas',async()=>{
 const api=mockApi(),doc=fixture();doc.panels[1].layers.push({...text('No'),type:'unknown'})
 await assert.rejects(()=>importSlide(api,doc),/Unsupported layer/);assert.equal(api.created.length,0)
 assert.throws(()=>validateSlide({...fixture(),width:0}),/invalid width/)
 await assert.rejects(()=>importSlide(mockApi({failFont:true}),fixture()),/Font load failed/)
})
test('failure rolls back newly created nodes and preserves existing content',async()=>{
 const api=mockApi({failOnImage:true}),existing=api.createRectangle()
 await assert.rejects(()=>importSlide(api,fixture(),{reference:true}),/Invalid image/)
 assert.deepEqual(api.currentPage.children,[existing])
})
test('decodes embedded image bytes without browser globals, rejects remote URLs',()=>{
 assert.deepEqual([...decodeImage('data:image/png;base64,iVBORw0KGgo=')],[137,80,78,71,13,10,26,10])
 assert.throws(()=>decodeImage('https://example.com/image.png'),/embedded/)
})
test('bundled plugin and UI scripts parse without unresolved module imports',async()=>{
 const code=await readFile(new URL('../figma-importer/code.js',import.meta.url),'utf8')
 new vm.Script(code)
 const ui=await readFile(new URL('../figma-importer/ui.html',import.meta.url),'utf8')
 new vm.Script(ui.match(/<script>([\s\S]*?)<\/script>/)[1])
 assert.ok(!/^export |^import /m.test(code))
})
