import {
  ContentBaseOut,
  isAssignment,
  isCertificate,
  isInstruction,
  isSukoAssignment,
  isSukoCertificate,
  Language,
  Oppimaara,
  SukoAssignmentDtoOut
} from '../types'

export const SWEDISH_A = 'TKRUA1'
export const FINNISH_A = 'TKFIA1'
export const KERTOMISTEHTAVA = '002'

const espanjaAOppimaara = 'VKA1.EA'
const ranskaAOppimaara = 'VKA1.RA'
export const saksaAOppimaara = 'VKA1.SA'
const venajaAOppimaara = 'VKA1.VE'
const englantiAOppimaara = 'VKENA1'

// Removes key-value pairs with null or undefined values from an object
// src https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
export function removeEmpty<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => {
      if (Array.isArray(v)) {
        // remove empty arrays
        return v.length > 0
      }
      // remove null and undefined
      return v !== null && v !== undefined
    })
  )
}

export const getContentName = (data: ContentBaseOut, teachingLanguage: Language) => {
  if (isSukoAssignment(data) || isSukoCertificate(data)) {
    return data.nameFi
  } else if (isAssignment(data) || isInstruction(data) || isCertificate(data)) {
    return teachingLanguage === 'FI' ? data.nameFi : data.nameSv
  } else {
    throw Error(`Data has unknown type: ${typeof data}`)
  }
}

export function isSukoKertomisTehtavaAndSpecificOppimaara(data: ContentBaseOut): boolean {
  if (!isSukoAssignment(data)) {
    return false
  }

  if (data.assignmentTypeKoodiArvo !== KERTOMISTEHTAVA) {
    return false
  }
  if (!data.oppimaara) {
    return false
  }
  const { kielitarjontaKoodiArvo, oppimaaraKoodiArvo } = data.oppimaara
  const koodiArvo = kielitarjontaKoodiArvo ? [oppimaaraKoodiArvo, kielitarjontaKoodiArvo].join('.') : oppimaaraKoodiArvo

  return isSpecificOppimaara(koodiArvo)
}

function isSpecificOppimaara(oppimaaraKoodiarvo: string) {
  const supportedOppimaaras = [
    espanjaAOppimaara,
    ranskaAOppimaara,
    saksaAOppimaara,
    venajaAOppimaara,
    englantiAOppimaara
  ]
  return supportedOppimaaras.includes(oppimaaraKoodiarvo)
}

export function isKertomisTehtavaAndSpecificOppimaara(data: OppimaaraTehtavatyyppi) {
  // 002 is the code for Kertomistehtävä
  if (data.assignmentTypeKoodiArvo !== KERTOMISTEHTAVA) {
    return false
  }
  if (!data.oppimaara) {
    return false
  }
  const { kielitarjontaKoodiArvo, oppimaaraKoodiArvo } = data.oppimaara
  const koodiArvo = kielitarjontaKoodiArvo ? [oppimaaraKoodiArvo, kielitarjontaKoodiArvo].join('.') : oppimaaraKoodiArvo
  return isSpecificOppimaara(koodiArvo)
}

type OppimaaraKoodiArvo = {
  oppimaara: Pick<Oppimaara, 'oppimaaraKoodiArvo' | 'kielitarjontaKoodiArvo'>
}

type OppimaaraTehtavatyyppi = Pick<SukoAssignmentDtoOut, 'assignmentTypeKoodiArvo'> & OppimaaraKoodiArvo
