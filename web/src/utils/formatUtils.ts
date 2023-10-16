export const toLocaleDate = (date: string | Date): string => new Date(date).toLocaleDateString('fi-FI')

export const preventLineBreaks = (input: string): string => input.replaceAll(' ', String.fromCharCode(0xa0))
