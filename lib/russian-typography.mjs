// Keep short prepositions, conjunctions and particles with the following word.
export function keepRussianFunctionWordsTogether(text=''){
 return text.replace(/(?<![\p{L}\p{N}_])(в|во|на|с|со|к|ко|у|о|об|обо|от|до|из|изо|за|по|под|над|при|про|без|для|и|а|но|да|или|не|ни|бы|же|ли)[ \t\u00a0]+(?=\S)/giu,'$1\u00a0')
}
import {keepLastWordsTogether} from './brand-copy.mjs'


export function onboardingTypography(text=''){
 return keepLastWordsTogether(keepRussianFunctionWordsTogether(text))
}
