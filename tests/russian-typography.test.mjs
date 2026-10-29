import test from 'node:test'
import assert from 'node:assert/strict'
import {keepRussianFunctionWordsTogether as glue,onboardingTypography} from '../lib/russian-typography.mjs'

test('Russian function words stay attached, including sentence starts and sequences',()=>{
 assert.equal(glue('В разделе и в полях справа. Для работы с ChatGPT.'),'В\u00a0разделе и\u00a0в\u00a0полях справа. Для\u00a0работы с\u00a0ChatGPT.')
 assert.equal(glue('Не забудьте про фото или логотип.'),'Не\u00a0забудьте про\u00a0фото или\u00a0логотип.')
})

test('onboarding copy keeps the final two words together without changing punctuation',()=>{
 assert.equal(onboardingTypography('Выберите фото для своего баннера.'),'Выберите фото для\u00a0своего\u00a0баннера.')
 assert.equal(onboardingTypography('Задайте формат'),'Задайте\u00a0формат')
 assert.equal(onboardingTypography('Фото'),'Фото')
})
test('preserves explicit line breaks, punctuation, embedded syllables and existing nonbreaking spaces',()=>{
 const text='Баннер\nна\nсайте. Пока, да! «В\u00a0студии» и фото.'
 assert.equal(glue(text),'Баннер\nна\nсайте. Пока, да! «В\u00a0студии» и\u00a0фото.')
 assert.equal(glue(glue(text)),glue(text))
})
