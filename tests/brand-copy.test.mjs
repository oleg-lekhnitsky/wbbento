import test from 'node:test'
import assert from 'node:assert/strict'
import {brandCopyParts,keepBrandTogether} from '../lib/brand-copy.mjs'
test('preserves city capitalization in any language without a dictionary',()=>{
 for(const text of ['работайте в Гюмри и Ванадзоре','водителям из Санкт-Петербурга','աշխատանք Գյումրիում և Երևանում','drive in New York and São Paulo'])assert.equal(brandCopyParts(text).map(p=>p.text).join(''),text)
})
test('preserves arbitrary copy while identifying brand tokens',()=>{
 const text='подключаем в Гюмри к wb taxi уже сегодня'
 const parts=brandCopyParts(text)
 assert.equal(parts.map(p=>p.text).join(''),text.replace('wb taxi','wb\u00a0taxi'))
 assert.deepEqual(parts.filter(p=>p.type!=='text').map(p=>p.type),['wb','taxi'])
})

test('keeps wb taxi together without changing explicit newlines or other words',()=>{
 assert.equal(keepBrandTogether('с wb taxi сегодня'),'с wb\u00a0taxi сегодня')
 assert.equal(keepBrandTogether('WB   Taxi, wb\u00a0taxi'),'WB\u00a0Taxi, wb\u00a0taxi')
 assert.equal(keepBrandTogether('wb\ntaxi'),'wb\ntaxi')
 assert.equal(keepBrandTogether('newb taxi and wb taximeter'),'newb taxi and wb taximeter')
})

test('keeps the final two subheading words together without crossing explicit lines',async()=>{
 const {keepLastWordsTogether}=await import('../lib/brand-copy.mjs')
 assert.equal(keepLastWordsTogether('начните работать уже сегодня'),'начните работать уже\u00a0сегодня')
 assert.equal(keepLastWordsTogether('начните работать\nсегодня'),'начните работать\nсегодня')
 assert.equal(keepLastWordsTogether('сегодня'),'сегодня')
})
