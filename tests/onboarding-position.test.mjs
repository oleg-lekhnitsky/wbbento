import test from 'node:test'
import assert from 'node:assert/strict'
import {onboardingPosition} from '../lib/onboarding-position.mjs'
const card={width:380,height:340},desktop={width:1500,height:1000}
test('sidebar guidance sits beside its target on either side of the editor',()=>{
 const left=onboardingPosition({left:20,top:80,width:250,height:760},card,desktop)
 assert.equal(left.side,'right');assert.equal(left.x,286);assert.equal(left.arrow,true)
 const right=onboardingPosition({left:1160,top:100,width:320,height:600},card,desktop)
 assert.equal(right.side,'left');assert.equal(right.x,764);assert.equal(right.arrow,true)
})
test('export guidance fits beneath the button at the top-right edge',()=>{
 const p=onboardingPosition({left:1340,top:20,width:130,height:32},card,desktop)
 assert.equal(p.side,'bottom');assert.equal(p.y,68);assert.ok(p.x+card.width<=1484)
})
test('mobile guidance uses vertical space and remains within the viewport',()=>{
 const p=onboardingPosition({left:16,top:90,width:358,height:150},{width:358,height:340},{width:390,height:844})
 assert.equal(p.side,'bottom');assert.equal(p.y,256);assert.ok(p.x>=16&&p.x+358<=374)
})
test('oversized targets keep the card visible and suppress a misleading pointer',()=>{
 const p=onboardingPosition({left:8,top:8,width:374,height:828},{width:358,height:400},{width:390,height:844})
 assert.ok(p.x>=16&&p.y>=16&&p.y+400<=828);assert.equal(p.arrow,false)
})
