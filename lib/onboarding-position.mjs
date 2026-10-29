// Prefer an adjacent side that fits, then keep the card within the viewport.
export function onboardingPosition(target,card,viewport){
 const margin=16,gap=16,clamp=(n,min,max)=>Math.max(min,Math.min(n,Math.max(min,max)))
 const width=Math.min(card.width,viewport.width-margin*2),height=Math.min(card.height,viewport.height-margin*2)
 const centerX=target.left+target.width/2,centerY=target.top+target.height/2
 const candidates={
  right:{x:target.left+target.width+gap,y:clamp(centerY-height/2,margin,viewport.height-height-margin)},
  left:{x:target.left-width-gap,y:clamp(centerY-height/2,margin,viewport.height-height-margin)},
  bottom:{x:clamp(centerX-width/2,margin,viewport.width-width-margin),y:target.top+target.height+gap},
  top:{x:clamp(centerX-width/2,margin,viewport.width-width-margin),y:target.top-height-gap},
 }
 const order=target.height<100?['bottom','top','right','left']:['right','left','bottom','top']
 const fits=p=>p.x>=margin && p.y>=margin && p.x+width<=viewport.width-margin && p.y+height<=viewport.height-margin
 let side=order.find(side=>fits(candidates[side]))
 if(!side){
  const space={right:viewport.width-target.left-target.width,left:target.left,bottom:viewport.height-target.top-target.height,top:target.top}
  side=order.reduce((best,next)=>space[next]>space[best]?next:best)
 }
 const point=candidates[side],x=clamp(point.x,margin,viewport.width-width-margin),y=clamp(point.y,margin,viewport.height-height-margin)
 const overlaps=x<target.left+target.width && x+width>target.left && y<target.top+target.height && y+height>target.top
 return {x,y,side,arrow:!overlaps,arrowX:clamp(centerX-x,24,width-24),arrowY:clamp(centerY-y,24,height-24)}
}
