import test from 'node:test'
import assert from 'node:assert/strict'
import {brandCopyParts} from '../lib/brand-copy.mjs'
test('preserves city capitalization in any language without a dictionary',()=>{
 for(const text of ['работайте в Гюмри и Ванадзоре','водителям из Санкт-Петербурга','աշխատանք Գյումրիում և Երևանում','drive in New York and São Paulo'])assert.equal(brandCopyParts(text).map(p=>p.text).join(''),text)
})
test('preserves arbitrary copy while identifying brand tokens',()=>{
 const text='подключаем в Гюмри к wb taxi уже сегодня'
 const parts=brandCopyParts(text)
 assert.equal(parts.map(p=>p.text).join(''),text)
 assert.deepEqual(parts.filter(p=>p.type!=='text').map(p=>p.type),['wb','taxi'])
})
