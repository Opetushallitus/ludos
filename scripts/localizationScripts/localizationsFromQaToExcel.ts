#!/usr/bin/env -S deno run --allow-net --allow-write
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs'

const response: Response = await fetch(
  'https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation?category=ludos',
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }
)

interface DataItem {
  key: string
  locale: string
  value: string
}

const data: DataItem[] = await response.json()

// Filter out objects with missing translations
const translationsMap: { [key: string]: { [key: string]: string } } = {}
for (const obj of data) {
  const key: string = obj['key']
  const locale: string = obj['locale']
  const value: string = obj['value']
  if (!(key in translationsMap)) {
    translationsMap[key] = { fi: '', sv: '' }
  }
  translationsMap[key][locale] = value
}

const translations: { [key: string]: { [key: string]: string } } = {}
for (const key in translationsMap) {
  if (translationsMap[key]['fi'] !== '') {
    translations[key] = translationsMap[key]
  }
}

const wsData: (string | number)[][] = [['Key', 'fi', 'sv']]
for (const key in translations) {
  wsData.push([key, translations[key]['fi'], translations[key]['sv']])
}

const ws = XLSX.utils.aoa_to_sheet(wsData)

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'SheetJS')

XLSX.writeFile(wb, 'ludos_qa_kaannokset.xlsx')
