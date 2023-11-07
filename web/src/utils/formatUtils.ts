export const toLocaleDate = (date: string | Date): string => new Date(date).toLocaleDateString('fi-FI')

export const preventLineBreaksFromSpace = (input: string): string => input.replaceAll(' ', String.fromCharCode(0xa0))
export const preventLineBreaksFromHyphen = (input: string): string =>
  input.replaceAll('-', String.fromCodePoint(0x2011))
