export function keepLastWordsTogether(text=''){
 return text.replace(/(\S+)[ \t\u00a0]+(\S+)([ \t]*)$/u,'$1\u00a0$2$3')
}
export function keepBrandTogether(text=''){
 return text.replace(/(?<![\p{L}\p{N}_])(wb)[ \t\u00a0]+(taxi)(?![\p{L}\p{N}_])/giu,'$1\u00a0$2')
}
export function keepPrepositionsTogether(text=''){
 return text.replace(/(?<![\p{L}\p{N}_])(по)[ \t\u00a0]+(?=\S)/giu,'$1\u00a0')
}
export function brandCopyParts(text=''){
 return keepPrepositionsTogether(keepBrandTogether(text)).split(/((?<![\p{L}\p{N}_])(?:wb|taxi)(?![\p{L}\p{N}_]))/giu).map(text=>({text,type:/^wb$/i.test(text)?'wb':/^taxi$/i.test(text)?'taxi':'text'}))
}
/** The browser owns this subtree while editing; Vue never patches its children. */
export function renderBrandCopy(element,text){
 const document=element.ownerDocument,fragment=document.createDocumentFragment()
 for(const part of brandCopyParts(text)){
  if(part.type==='text'){fragment.append(document.createTextNode(part.text));continue}
  const span=document.createElement('span')
  if(part.type==='wb'){span.className='wb-text';span.append('w');const b=document.createElement('span');b.className='wb-text__b';b.textContent='b';span.append(b)}
  if(part.type==='taxi'){span.append(part.text[0]);const a=document.createElement('span');a.className='taxi-text__a';a.textContent=part.text[1];span.append(a,part.text.slice(2))}
  fragment.append(span)
 }
 element.replaceChildren(fragment)
}
