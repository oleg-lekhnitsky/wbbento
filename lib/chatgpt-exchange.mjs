import {validateProject,createProject,assetPlacementReset,layoutIds,formatIds,formats,presets,defaults,listLayouts} from './bento-project.mjs'
import imagePlacements from '../data/figma-image-placements.json' with {type:'json'}
import carReferences from '../data/car-references.json' with {type:'json'}
import {driverPhotoStyles,driverPhotoPrompt,carPhotoPrompt,campaignPhotoLighting,campaignPhotoBackground} from './image-prompts.mjs'
export const REFERENCE_SITE_ORIGIN='https://wbbento.vercel.app'
export const imageSlots={photo:'image',vehicle:'vehicleImage',artwork:'artwork',logo:'logo'}
export function publicReferenceUrl(origin,asset){
 try{
  const base=new URL(origin),host=base.hostname.toLowerCase()
  if(base.protocol!=='https:' || host==='localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.includes(':') || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host))return ''
  if(!asset.startsWith('/assets/'))return ''
  return new URL(asset,base.origin).href
 }catch{return ''}
}
export function createChatGptBrief(project,{request='',imageMode='keep',age='',nationality='',changes,siteOrigin=REFERENCE_SITE_ORIGIN,suggestLayout=true,driverStyle,carAngle}={}){
 const snapshot=validateProject(JSON.parse(JSON.stringify(project))),attachments=[]
 for(const [slot,key] of Object.entries(imageSlots))if(snapshot.data[key]?.startsWith('data:')){
  attachments.push({slot,note:'The current image is a local upload. Attach it to this chat if it should guide generation.'})
  snapshot.data[key]=key==='logo'?'':createProject({layout:snapshot.preset}).data[key]
 }
 if(driverStyle)snapshot.data.imagePrompt.style=driverStyle
 if(carAngle)snapshot.data.carPrompt.angle=carAngle
 if(imageMode==='driver')snapshot.data.imagePrompt={...snapshot.data.imagePrompt,age:String(age),nationality:nationality.trim()}
 const requestedFormat=formatIds.indexOf(changes?.format?.format)
 const imageFormat=requestedFormat>=0?requestedFormat:snapshot.format
 const selectedCar=carReferences.find(item=>item.id===snapshot.data.carPrompt.angle)||carReferences[0]
 const selectedDriver=driverPhotoStyles.find(item=>item.id===snapshot.data.imagePrompt.style)||driverPhotoStyles[0]
 const images=[]
 if(imageMode==='driver')images.push({slot:'photo',filename:'driver-photo.png',reference_style:selectedDriver.id,reference_name:selectedDriver.name,reference_url:publicReferenceUrl(siteOrigin,'/assets/figma/'+selectedDriver.image+'.png')||null,prompt:driverPhotoPrompt({...defaults.imagePrompt,...snapshot.data.imagePrompt,age,nationality})})
 if(imageMode==='car')images.push({slot:'photo',filename:'moving-car.png',operation:'edit-reference',reference_angle:selectedCar.id,reference_name:selectedCar.name,reference_url:publicReferenceUrl(siteOrigin,selectedCar.src)||null,prompt:carPhotoPrompt({...defaults.carPrompt,...snapshot.data.carPrompt},formats[imageFormat].ratio)})

 const referenceImages={selected_car_angle:selectedCar.id,car_angles:carReferences.map(item=>({angle:item.id,name:item.name,url:publicReferenceUrl(siteOrigin,item.src)||null})),selected_driver_style:selectedDriver.id,driver_styles:[selectedDriver,...driverPhotoStyles.filter(item=>item.id!==selectedDriver.id)].map(item=>({selected:item.id===selectedDriver.id,style:item.id,name:item.name,scene:item.scene,url:publicReferenceUrl(siteOrigin,'/assets/figma/'+item.image+'.png')||null}))}
 return `Help me create a WB Taxi campaign banner. The editor will render the final banner; you provide its content JSON and, when requested, separate generated photo attachments.

SELECTED PHOTO REFERENCE — LOCKED
${imageMode==='driver'?JSON.stringify({style:selectedDriver.id,name:selectedDriver.name,url:publicReferenceUrl(siteOrigin,'/assets/figma/'+selectedDriver.image+'.png')||null,scene:selectedDriver.scene},null,2):imageMode==='car'?JSON.stringify({angle:selectedCar.id,name:selectedCar.name,url:publicReferenceUrl(siteOrigin,selectedCar.src)||null},null,2):'Keep existing photos unless the user later explicitly requests a new one.'}
The selected reference is authoritative for every copy variant and the final photo. Do not silently substitute the first catalog item, a template's default image, a different driver style, pose, clothing or camera angle. Choosing a copy variant or another layout does NOT change the selected photo reference. Other references below are alternatives only if the user explicitly asks to change the photo style. In particular, "phone" means a safely parked driver holding a smartphone toward the passenger-side camera with a candid smile; do not turn it into a driving portrait with hands on the steering wheel.
When asking about photo generation, name the SELECTED reference and use its exact reference_url as the only reference preview. Never use stock search photos, unrelated thumbnails or a made-up image to illustrate the selection. Do not use image search, search-result carousels, visual lookups, product cards, app screenshots or keyword-matched pictures as a reference preview. A photo merely matching words such as "driver" or "phone" is not our reference. A disclaimer such as "visual lookup, not verified" does not make a substitute acceptable. If the selected URL cannot be opened and its actual pixels inspected, show a text-only description with the exact reference URL as a normal link, and immediately ask the user to attach that exact reference using Copy reference image in the editor. Display NO thumbnail, image card or preview illustration in this fallback. Do not search for a substitute or generate a placeholder preview. Do not claim it was inspected or supplied to the image tool unless it was. Include the selected image as a visual input when the image tool supports it; if you cannot do that, ask for its attachment before generating. Change the person's age/nationality as requested while retaining the selected scene, viewpoint, lighting and palette.

CAR PHOTO METHOD
For car requests, use image editing with the selected reference as the base image, not text-to-image redrawing. Preserve the original vehicle model, geometry, wheels, WB wordmark, number 260 and exact livery panel boundaries. Create the clean street/background around that vehicle, integrate shadows and lighting, and apply panning blur mainly to the environment. If exact branding is required, composite the original car pixels; an image-editing prompt alone is not a guarantee of pixel-perfect retention. Do not claim to have edited the original when the tool only generated a similar replacement. Pass the actual selected reference into an editing-capable tool; if unavailable, explain the limitation instead of silently switching to a newly drawn car. Driver-photo requests still generate a new person from the selected pose/style reference.

WORKFLOW — CHOOSE BEFORE GENERATING
1. In your FIRST response, show 3 numbered campaign variants in plain language, not JSON. For each variant, show the proposed headline, supporting text and benefit where those fields exist in this layout. If a new photo is requested, also describe its proposed direction in one short sentence. Vary only the selected creative elements; preserve the offer facts, chosen language, age, nationality, cities, exact partner/contact details and format. Follow TEMPLATE SELECTION below for layout recommendations. Do not invent extra layouts or unrequested changes. If the request leaves no creative choices, explain that instead of manufacturing differences.
2. End by asking which variant the user prefers (or wants to combine), and explicitly offer to show 3 more variants. If they ask for more, show fresh alternatives within the same selected changes, then ask again; do not choose for them. STOP and wait for their reply. Do not return final JSON, generate images or use an image-generation tool before the user chooses.
3. AFTER the user selects or revises a variant, return the importable JSON for that selected version. Do not generate photos yet. Immediately AFTER the JSON, ask whether they would like you to generate the photo now, or keep the existing image. If a photo direction was selected, summarize it in the question. STOP and wait for an explicit answer.
4. Only after they confirm photo generation, generate the actual photo attachment using the supplied prompt and any attached reference. If they decline, retain existing images; if the previous JSON listed pending replacements, provide corrected JSON with images: []. If they opt into photos after initially keeping images, confirm the photo type and any missing driver age/nationality, then provide updated JSON with its image slot, filename and prompt before generating. The JSON output rules below apply after variant selection, not the first response.

TEMPLATE SELECTION
${suggestLayout?`Recommend the best-fitting EXISTING layout for this campaign before showing the copy variants. Name the recommended template and briefly explain how its visible content blocks suit the offer and available photos. Each variant should identify its proposed layout; you may reuse the same best-fitting layout across all 3 variants. Do not invent layouts or swap the current layout silently. Choosing a variant approves its stated layout. A single offer with a driver portrait often suits Driver introduction (preset 0): headline plus short supporting text, without a second benefit card repeating the headline. Vehicle rental (1), Your own car (6) and Rental offer (7) suit a vehicle-led campaign with an additional distinct benefit. Photo & payments (5) suits a large photo and one main benefit message. Rental & driver (2), Start today (3) and Driver recruitment (4) suit a headline plus a genuinely different supporting benefit. If there is only one factual selling point, prefer a layout with fewer text blocks rather than repeating it or inventing benefits. After approval, use the chosen layout's defaults from AVAILABLE LAYOUTS for assets, colors and crop settings; preserve the author's partner/contact details, cities and confirmed copy, and preserve existing photo assets unless replacement was requested. Clear layout-specific elementTransforms when switching layouts. Keep format unless a format change was requested.`:'Keep the current template. Do not propose another layout or change project.preset.'}

SELECTED CHANGES
${changes===undefined?'Follow MY REQUEST below.':JSON.stringify(changes,null,2)}
${changes===undefined?'':`Change only the selected categories plus anything explicitly requested in MY REQUEST and IMAGE REQUESTS. For copy, rewrite heading/description in the requested language (or retain current language if blank); translate benefit, labels and data.partnerCaption (the official partner caption) too if a language is specified, retaining the offer facts. Translate partnerCaption into that language even when partner details are not selected, preferably as two short lines separated by a newline; leave the official WB logo image untouched. For cities, use the supplied newline-separated cities for chips and update any city references in text, preserving capitalization and grammatical inflections. For offer, treat the supplied offer as the campaign message: rewrite the visible copy as one coherent section, even when copy is not separately selected. State the main offer ONCE, in the headline if visible or otherwise the main benefit. Supporting text should provide a complementary call to action or verified detail, and a separate benefit should add a DIFFERENT verified selling point. Do not paraphrase the same offer across headline, description and benefit. If no additional fact is provided, leave an optional description/benefit empty rather than inventing a claim. If this layout has no headline, communicate the offer in its visible benefit text. Translate the offer into the requested language, or the existing copy language if none is requested. Keep qualifiers such as duration, price and eligibility accurate; do not add conditions, invent prices or turn a temporary promotion into a permanent promise. Update labels only if relevant. For example, "free car for the first month" must explicitly communicate that the car rental is free for the first month, rather than retaining a generic flexible-work headline. For partner, use the exact supplied partner, website and phone. For format, set the numeric project.format using AVAILABLE FORMATS. Preserve all other content and layout parameters.`}
${imageMode==='keep'?'Keep all existing images and return images: [] in the initial JSON. After the JSON, offer optional photo generation, but do not generate photos unless the user explicitly opts in.':'Include the requested photo slot and prompt in the selected JSON, then ask whether to generate it now. After the user explicitly confirms, generate the actual photo using your image-generation tool, not just its prompt. Return the photo attachment. If your image tool is unavailable, say so explicitly.'}

MY REQUEST
${request.trim() || (changes===undefined?'Create a new variation of this banner, preserving its layout and design parameters.':'Apply the selected changes above; preserve everything else.')}

RULES
- Start from CURRENT PROJECT below. Keep preset, format, crop, image transforms, spacing and brand settings unless explicitly changed by my request or an approved template recommendation under TEMPLATE SELECTION.
- Edit heading, description, benefit, partner, partnerCaption, city, benefitLabels, website and phone as needed. Default campaign copy is lowercase; preserve city/proper-name capitalization in any language and inflection. city and benefitLabels are newline-separated strings with any number of entries.
- Do not guess photoZoom, position, positionY or photo elementTransforms. These are source-image crop controls, not content choices. Preserve them for an unchanged photo/layout; the importer restores suitable source-specific cropping when the photo or layout changes.
- Before returning JSON, check that headline, description and benefit do not repeat the same promise in different words. Empty optional copy is acceptable; never add unsupported benefits just to fill space.
- Do not invent CSS, coordinates, fonts, logos or new layouts. Our renderer controls geometry, text fitting, WB Sans, Armenian Google Sans Bold, chips, and the official WB lockup. Keep data.wbLogo exactly "/wb-taxi.svg".
- The editor retains current local uploads when their bundled fallback paths remain unchanged in the same layout.
- Local /assets/ paths refer to bundled editor images, not images you can fetch. Retain them in project.data until the user supplies generated image files. Never insert sandbox:/ paths, external URLs, filenames, image-slot placeholders, or base64 images into project.data.
- After variant selection AND explicit photo confirmation, for requested photos, use IMAGE REQUESTS as the style/lighting/camera instructions. Generate each photo separately using your image tool if available. Do not generate a flattened banner or put campaign text/chips on the photos. If no image tool is available, return the prompts and say that the images still need to be generated.
- Public reference URLs below are visual references only; never place them in project.data. If your tools can open reference images, inspect the selected angle and use that actual image as the identity reference for photo generation. A URL mentioned in text is not proof that an image-generation tool received the image: if you cannot open or pass it as a visual input, ask the user to attach it. Preserve the reference car model, wheels, exact WB livery and angle. Null URLs mean this site is running locally; ask for an attachment instead.
- Attach the generated photos separately, with filenames matching images[].filename where possible. A car identity reference must be attached by the user to reproduce the exact vehicle/livery; do not claim you have seen an unattached reference.
- Only after variant selection, return ONE JSON code block with exactly {"project": <complete edited project>, "images": <array of image requests>}. Each images item is {"slot":"photo|vehicle|artwork|logo","filename":"name.png","reference_url":"public HTTPS reference URL or null","prompt":"generation prompt"}. Preserve operation when supplied (car requests use edit-reference), reference_style/reference_angle, reference_name and reference_url from IMAGE REQUESTS. Change them only if the user explicitly chooses a different photo reference, then use the matching URL from REFERENCE IMAGE URLS if the user chooses a different reference. Use null for local/unavailable references and ask for an attachment. reference_url is guidance for image generation, not the generated image or a project.data asset. Include only the slots that need replacement; use [] to retain all images. Never change the official WB logo. Keep the supplied project version and numeric preset/format indices.

AVAILABLE LAYOUTS
${JSON.stringify(listLayouts().map(item=>({preset:item.index,id:item.id,name:item.name,defaults:item.defaults,content:item.index===0?'Headline and supporting text, driver photo; no separate benefit in the standard layout':item.index===5?'Large photo and one benefit message; no headline':[1,6,7].includes(item.index)?'Headline, supporting text, separate benefit, vehicle cutout':'Headline, supporting text, separate benefit, driver photo'})))}
AVAILABLE FORMATS
${JSON.stringify(formats.map((f,index)=>({format:index,id:formatIds[index],width:f.w,height:f.h})))}

CURRENT PROJECT
${JSON.stringify(snapshot,null,2)}

IMAGE REQUESTS
${JSON.stringify(images,null,2)}

SHARED PHOTO ART DIRECTION
Lighting: ${campaignPhotoLighting}.
Background: ${campaignPhotoBackground}.
The catalog contains all four driver references for explicit user-requested alternatives. The selected driver style is LOCKED, not merely a preference. Use only that style for the current request; retain its camera viewpoint, scene, lighting and palette while changing the person as requested. Reference URLs alone do not mean the images were attached to the image-generation tool.

REFERENCE IMAGE URLS
${JSON.stringify(referenceImages,null,2)}
${attachments.length?'\nREFERENCE ATTACHMENTS\n'+JSON.stringify(attachments,null,2):''}

Start by presenting the 3 variants, offer more variants, and wait for a choice. After selection, return the edited JSON and ask whether to generate photos. Wait for explicit confirmation before producing any image attachments.`
}
export function parseChatGptResult(text,baseProject){
 const trimmed=text.trim(),fences=[...trimmed.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)]
 if(fences.length>1)throw new Error('Paste one result JSON block at a time.')
 let input
 try{input=JSON.parse(fences.length?fences[0][1]:trimmed)}catch{throw new Error('Paste the JSON result from ChatGPT, or upload its JSON file.')}
 const candidate=input.project || input
 const project=candidate.version?validateProject(candidate):createProject(candidate)
 const images=input.project?(input.images ?? []):[]
 if(!Array.isArray(images)||images.length>4)throw new Error('Images must be an array with at most four image slots.')
 const seen=new Set()
 for(const image of images){
  if(!image || !Object.hasOwn(imageSlots,image.slot) || seen.has(image.slot))throw new Error('Each image must use a unique photo, vehicle, artwork or logo slot.')
  seen.add(image.slot)
  if(typeof image.filename!=='string'||!/^[-\w .]{1,100}\.(png|jpe?g|webp)$/i.test(image.filename))throw new Error('Use a PNG, JPEG or WebP filename without folders for each image.')
  if(image.reference_url!==undefined && image.reference_url!==null){
   try{const url=new URL(image.reference_url);if(typeof image.reference_url!=='string'||image.reference_url.length>2048||url.protocol!=='https:')throw new Error()}catch{throw new Error('Reference URLs must be public HTTPS links or null.')}
  }
  if(image.prompt!==undefined && (typeof image.prompt!=='string'||image.prompt.length>12000))throw new Error('An image prompt is too long or invalid.')
 }
 const restored=JSON.parse(JSON.stringify(project))
 if(baseProject && baseProject.preset===restored.preset){
  const base=validateProject(baseProject),fallback=createProject({layout:restored.preset})
  for(const key of Object.values(imageSlots))if(base.data[key]?.startsWith('data:') && restored.data[key]===(key==='logo'?'':fallback.data[key]))restored.data[key]=base.data[key]
 }
 const base=baseProject?validateProject(baseProject):undefined
 const photoUnchanged=base && base.data.image===restored.data.image
 const sameFrame=photoUnchanged && base.preset===restored.preset && base.format===restored.format
 Object.assign(restored.data,assetPlacementReset(restored.data,'image'))
 if(sameFrame){
  for(const key of ['position','positionY','photoZoom','photoFit'])restored.data[key]=base.data[key]
  for(const [scope,transforms] of Object.entries(base.data.elementTransforms || {}))if(transforms.photo)restored.data.elementTransforms[scope]={...restored.data.elementTransforms[scope],photo:{...transforms.photo}}
 }else{
  const placement=Object.values(imagePlacements).find(item=>item.photo?.source===restored.data.image)?.photo
  if(placement){
   restored.data.position=placement.defaultControls.position
   restored.data.positionY=placement.defaultControls.positionY
   const exact=imagePlacements[String(restored.preset)]?.photo
   if(restored.format===0 && exact?.source===restored.data.image)restored.data.photoZoom=exact.defaultControls.photoZoom
  }else if(photoUnchanged){
   restored.data.position=base.data.position;restored.data.positionY=base.data.positionY
  }
 }
 return {project:restored,images}
}
export function applyChatGptImages(result,uploads={},keep=[]){
 let project=validateProject(JSON.parse(JSON.stringify(result.project)))
 for(const item of result.images){
  if(keep.includes(item.slot))continue
  const source=uploads[item.slot],key=imageSlots[item.slot]
  if(!source)throw new Error('Upload '+item.filename+' or choose Keep existing image.')
  if(!/^data:image\/(png|jpeg|webp);base64,/.test(source))throw new Error('Upload PNG, JPEG or WebP images.')
  project.data={...project.data,...assetPlacementReset(project.data,key),[key]:source}
 }
 return validateProject(project)
}
