import {
  ContentBaseOut,
  isAssignment,
  isCertificate,
  isInstruction,
  isSukoAssignment,
  isSukoCertificate,
  TeachingLanguage
} from '../types'

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

export const getContentName = (data: ContentBaseOut, teachingLanguage: TeachingLanguage) => {
  if (isSukoAssignment(data) || isSukoCertificate(data)) {
    return data.nameFi
  } else if (isAssignment(data) || isInstruction(data) || isCertificate(data)) {
    return teachingLanguage === 'fi' ? data.nameFi : data.nameSv
  } else {
    throw Error(`Data has unknown type: ${typeof data}`)
  }
}
