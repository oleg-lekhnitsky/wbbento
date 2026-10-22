export const partnerLanguages = [
 {value:'ru',label:'Русский',caption:'официальный\nпартнер'},
 {value:'uz',label:'Узбекский',caption:'rasmiy\nhamkor'},
 {value:'ky',label:'Кыргызский',caption:'расмий\nөнөктөш'},
 {value:'hy',label:'Армянский',caption:'պաշտոնական\nգործընկեր'},
 {value:'ka',label:'Грузинский',caption:'ოფიციალური\nპარტნიორი'},
 {value:'kk',label:'Казахский',caption:'ресми\nсеріктес'},
]
const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/g,' ').trim()
export function partnerLanguage(caption) {
 const text=normalize(caption)
 return partnerLanguages.find(language=>normalize(language.caption)===text)
  || partnerLanguages.find(language=>language.value===(/[\u0530-\u058f]/.test(text)?'hy':/[\u10a0-\u10ff]/.test(text)?'ka':/[әғқңұһі]/.test(text)?'kk':/[ө]/.test(text)?'ky':/rasmiy|hamkor/.test(text)?'uz':'ru'))
}
export function partnerCaption(language) {
 return (partnerLanguages.find(item=>item.value===language)||partnerLanguages[0]).caption
}
