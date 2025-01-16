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

export function isSukoKertomisTehtavaButNotAFinnishOrASwedish(data: ContentBaseOut): boolean {
  if (!isSukoAssignment(data)) {
    return false
  }

  return isKertomisTehtavaButNotAFinnishOrASwedish(data)
}

type OppimaaraTehtavatyyppi = Pick<SukoAssignmentDtoOut, 'assignmentTypeKoodiArvo'> & {
  oppimaara: Pick<Oppimaara, 'oppimaaraKoodiArvo'>
}

export function isKertomisTehtavaButNotAFinnishOrASwedish(data: OppimaaraTehtavatyyppi): boolean {
  // 002 is the code for Kertomistehtävä
  if (data.assignmentTypeKoodiArvo !== KERTOMISTEHTAVA) {
    return false
  }

  if (data.oppimaara.oppimaaraKoodiArvo === SWEDISH_A) {
    return false
  }

  if (data.oppimaara.oppimaaraKoodiArvo === FINNISH_A) {
    return false
  }

  return true
}
