import en from './files/en.json'
import de from './files/de.json'
import es from './files/es.json'
import uk from './files/uk.json'

import enFlag from '@wallet/translations/flags/en.png'
import ukFlag from '@wallet/translations/flags/uk.png'
import deFlag from '@wallet/translations/flags/de.png'
import esFlag from '@wallet/translations/flags/es.png'

export const flags = {
    en: enFlag,
    uk: ukFlag,
    de: deFlag,
    es: esFlag,
}

let translations = {}

const allTranslations = {en, de, es, uk}

export const setTranslations = (languageCode) => {
    if (allTranslations[languageCode]) {
        translations = allTranslations[languageCode]
    } else {
        translations = en
    }
    return translations
}

export const t = (key) => translations[key] || en[key] || key
