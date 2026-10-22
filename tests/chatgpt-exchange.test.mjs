import test from 'node:test'
import assert from 'node:assert/strict'
import {createProject} from '../lib/bento-project.mjs'
import {createChatGptBrief,parseChatGptResult,applyChatGptImages,publicReferenceUrl} from '../lib/chatgpt-exchange.mjs'
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
test('brief carries exact parameters and existing image prompts without embedding uploaded images',()=>{
 const project=createProject({layout:'photo-payments',format:'landscape',data:{image:pixel}})
 const before=JSON.stringify(project),brief=createChatGptBrief(project,{request:'A banner for Երևան',imageMode:'driver',age:'42',nationality:'Armenian'})
 assert.ok(brief.includes('42-year-old'));assert.ok(brief.includes('Armenian'));assert.ok(brief.includes('Երևան'));assert.ok(!brief.includes(pixel));assert.ok(brief.includes('"preset": 5'));assert.ok(brief.includes('"format": 3'));assert.equal(JSON.stringify(project),before)
 const car=createChatGptBrief(project,{imageMode:'car'});assert.ok(car.includes('panning shot'));assert.ok(car.includes('1.91:1'));assert.ok(car.includes('"filename": "moving-car.png"'))
})
test('imports fenced results and atomically maps images while resetting stale transforms',()=>{
 const project=createProject({data:{elementTransforms:{'3:1080x1080':{photo:{x:50,y:20,scale:2,rotation:15}}},photoZoom:200}})
 const text='Here is your banner:\n```json\n'+JSON.stringify({project,images:[{slot:'photo',filename:'driver.png'}]})+'\n```'
 const result=parseChatGptResult(text),before=JSON.stringify(result)
 assert.throws(()=>applyChatGptImages(result),/Upload driver.png/)
 const updated=applyChatGptImages(result,{photo:pixel});assert.equal(updated.data.image,pixel);assert.equal(updated.data.photoZoom,100);assert.ok(!updated.data.elementTransforms['3:1080x1080']?.photo);assert.equal(JSON.stringify(result),before)
 assert.equal(applyChatGptImages(result,{},['photo']).data.image,project.data.image)
 assert.equal(parseChatGptResult(JSON.stringify(project)).images.length,0)
 assert.equal(parseChatGptResult('{"layout":"rental-offer","data":{"city":"Գյումրի"}}').project.data.city,'Գյումրի')
})
test('rejects unknown slots, duplicate slots, remote assets and unsafe filenames before applying',()=>{
 const project=createProject()
 for(const images of [[{slot:'wbLogo',filename:'wb.png'}],[{slot:'photo',filename:'../photo.png'}],[{slot:'photo',filename:'a.png'},{slot:'photo',filename:'b.png'}]])assert.throws(()=>parseChatGptResult(JSON.stringify({project,images})))
 assert.throws(()=>parseChatGptResult('not json'),/Paste the JSON/)
 project.data.image='https://example.com/image.png';assert.throws(()=>parseChatGptResult(JSON.stringify({project,images:[]})),/local asset/)
})

test('round trip retains local uploads while JSON carries only a bundled fallback',()=>{
 const original=createProject({data:{image:pixel,logo:pixel}}),returned=createProject()
 const result=parseChatGptResult(JSON.stringify({project:returned,images:[]}),original)
 assert.equal(result.project.data.image,pixel);assert.equal(result.project.data.logo,pixel)
})

test('selected change categories and output expectations are explicit in the copied brief',()=>{
 const project=createProject(),changes={cities:{cities:'Երևան\nԳյումրի'},format:{format:'landscape'},partner:{partner:'New partner',website:'example.com',phone:'+374 123456'}}
 const brief=createChatGptBrief(project,{changes,imageMode:'car'})
 assert.ok(brief.includes(JSON.stringify(changes,null,2)))
 assert.ok(brief.includes('generate the actual photo using your image-generation tool'))
 assert.ok(brief.includes('Output aspect ratio 1.91:1'))
 assert.equal(project.format,0)
 const keep=createChatGptBrief(project,{changes:{copy:{language:'Armenian'}}})
 assert.ok(keep.includes('Keep all existing images and return images: []'))
 assert.ok(keep.includes('Change only the selected categories'))
})

test('brief offers more variants and asks about photo generation after JSON',()=>{
 const brief=createChatGptBrief(createProject(),{imageMode:'driver',age:'35',nationality:'Armenian'})
 assert.ok(brief.includes('offer to show 3 more variants'))
 assert.ok(brief.includes('Immediately AFTER the JSON, ask whether'))
 assert.ok(brief.includes('Only after they confirm photo generation'))
 assert.ok(!brief.includes('After the user chooses a variant, generate the actual photo'))
})

test('brief includes deployed car references without sending localhost URLs',()=>{
 const brief=createChatGptBrief(createProject(),{imageMode:'car',siteOrigin:'https://bento.example'})
 assert.ok(brief.includes('https://bento.example/assets/figma/cars/front-left-no-plate.png'))
 assert.ok(brief.includes('https://bento.example/assets/figma/cars/rear-right.png'))
 assert.ok(brief.includes('ask the user to attach it'))
 for(const origin of ['http://localhost:3000','https://localhost:3000','https://127.0.0.1','https://192.168.1.5','https://172.16.0.1'])assert.equal(publicReferenceUrl(origin,'/assets/reference.png'),'')
 assert.ok(!createChatGptBrief(createProject(),{siteOrigin:'http://localhost:3000'}).includes('http://localhost:3000/assets/'))
})

test('template guidance recommends existing layouts and prevents repeating a single offer',()=>{
 const project=createProject({layout:'rental-driver'})
 const brief=createChatGptBrief(project,{changes:{offer:{offer:'free car for the first month'}}})
 assert.ok(brief.includes('Driver introduction (preset 0)'))
 assert.ok(brief.includes('State the main offer ONCE'))
 assert.ok(brief.includes('Choosing a variant approves its stated layout'))
 assert.ok(brief.includes('Clear layout-specific elementTransforms'))
 assert.ok(brief.includes('no separate benefit in the standard layout'))
 assert.ok(createChatGptBrief(project,{suggestLayout:false}).includes('Do not propose another layout or change project.preset'))
 assert.equal(project.preset,2)
})

test('official partner caption is localized as copy and survives import independently of partner details',()=>{
 const project=createProject({data:{partnerCaption:'պաշտոնական\nգործընկեր'}})
 assert.equal(parseChatGptResult(JSON.stringify({project,images:[]})).project.data.partnerCaption,'պաշտոնական\nգործընկեր')
 const brief=createChatGptBrief(project,{changes:{copy:{language:'Armenian'}}})
 assert.ok(brief.includes('Translate partnerCaption into that language even when partner details are not selected'))
 assert.equal(createProject().data.partnerCaption,'официальный\nпартнер')
})

test('imports use the photo source crop instead of carrying crop settings from another layout',()=>{
 const base=createProject({layout:'start-today'})
 const returned=createProject({layout:'driver-introduction',data:{image:base.data.image,position:0,positionY:0,photoZoom:300,elementTransforms:{'0:1080x1080':{photo:{x:900,y:0,scale:3,rotation:90}}}}})
 const result=parseChatGptResult(JSON.stringify({project:returned,images:[]}),base).project
 assert.equal(result.data.photoZoom,100);assert.equal(result.data.position,base.data.position)
 assert.ok(!result.data.elementTransforms['0:1080x1080']?.photo)
 const edited=createProject({data:{position:75,positionY:40,photoZoom:110,elementTransforms:{'3:1080x1080':{photo:{x:10,y:0,scale:1,rotation:0}}}}})
 const guessed=structuredClone(edited);guessed.data.position=0;guessed.data.photoZoom=300
 const preserved=parseChatGptResult(JSON.stringify({project:guessed,images:[]}),edited).project
 assert.equal(preserved.data.position,75);assert.equal(preserved.data.photoZoom,110)
 assert.deepEqual(preserved.data.elementTransforms,edited.data.elementTransforms)
})

test('all four driver references and the shared lighting/background direction are included',()=>{
 const brief=createChatGptBrief(createProject(),{imageMode:'driver',driverStyle:'phone',siteOrigin:'https://bento.example',age:'40',nationality:'Armenian'})
 for(const name of ['driver-purple','driver-blue','driver-purple-phone','driver-phone'])assert.ok(brief.includes('https://bento.example/assets/figma/'+name+'.png'))
 assert.ok(brief.includes('"selected_driver_style": "phone"'))
 assert.ok(brief.includes('No trees, foliage, bushes, parks or greenery'))
 assert.ok(brief.includes('defined window-frame shadows'))
 assert.ok(brief.includes('safely parked car'))
})

test('each image request carries its selected reference URL as generation metadata',()=>{
 const project=createProject()
 const requests=options=>JSON.parse(createChatGptBrief(project,options).split('IMAGE REQUESTS\n')[1].split('\n\nSHARED PHOTO ART DIRECTION')[0])
 assert.equal(requests({imageMode:'driver',driverStyle:'portrait',siteOrigin:'https://bento.example'})[0].reference_url,'https://bento.example/assets/figma/driver-blue.png')
 assert.equal(requests({imageMode:'car',siteOrigin:'https://bento.example'})[0].reference_url,'https://bento.example/assets/figma/cars/front-left-no-plate.png')
 assert.equal(requests({imageMode:'car',siteOrigin:'http://localhost:3000'})[0].reference_url,null)
 const images=requests({imageMode:'car',siteOrigin:'https://bento.example'})
 const result=parseChatGptResult(JSON.stringify({project,images}))
 assert.equal(result.images[0].reference_url,images[0].reference_url)
 assert.equal(result.project.data.image,project.data.image)
 images[0].reference_url='javascript:alert(1)';assert.throws(()=>parseChatGptResult(JSON.stringify({project,images})),/HTTPS/)
})

test('reference URLs default to the production website independently of the editor host',()=>{
 const brief=createChatGptBrief(createProject(),{imageMode:'driver',driverStyle:'portrait'})
 assert.ok(brief.includes('"reference_url": "https://wbbento.vercel.app/assets/figma/driver-blue.png"'))
 assert.ok(brief.includes('https://wbbento.vercel.app/assets/figma/cars/front-left-no-plate.png'))
})
