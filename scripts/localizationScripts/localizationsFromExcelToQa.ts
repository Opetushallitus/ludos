#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --unstable --allow-run

import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs'

const __dirname = new URL('.', import.meta.url).pathname;
const p = Deno.run({ cmd: [`${__dirname}/../update_backups.sh`] });

console.log("Backing up koodistos and localizations...")
const backupResult = await p.status()
if (backupResult.success) {
  console.log("Succesfully backed up koodistos and localizations")
} else {
  throw new Error("Was unable to run backup, quitting")
}

const file_path = 'ludos_qa_kaannokset.xlsx'

if (!file_path) {
  throw new Error('Please provide a file path')
}

const workbook = await XLSX.readFile(file_path)
const worksheet = workbook.Sheets[workbook.SheetNames[0]]
let data: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
// Remove the header row
data = data.slice(1)

const url = 'https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation/update'
const headers: Record<string, string> = {
  authority: 'virkailija.untuvaopintopolku.fi',
  accept: 'application/json, text/plain, */*',
  'content-type': 'application/json; charset=UTF-8',
  'caller-id': '1.2.246.562.10.00000000001.lokalisointi-frontend',
  cookie: 'JSESSIONID=00000000000000000000000000000000; CSRF=00000000000000000000000000000000',
  csrf: '00000000000000000000000000000000'
}

interface Localization {
  category: string
  key: string
  locale: string
  value: string
}

const payload_array: Localization[] = [
  ...data.map((row) => ({
    category: 'ludos',
    key: row[0],
    locale: 'fi',
    value: row[1]
  })),
  ...data.map((row) => ({
    category: 'ludos',
    key: row[0],
    locale: 'sv',
    value: row[2]
  }))
]

const payload_string = JSON.stringify(payload_array)

console.log('Created json file with payload, to do post request to untuva uncomment the code below')
await Deno.writeTextFile('payload.json', payload_string)

// const response = await fetch(url, {
//   method: 'POST',
//   headers: headers,
//   body: JSON.stringify(payload_array),
// });

// if (!response.ok) {
//   throw new Error(`HTTP error! status: ${response.status}`);
// } else {
//   console.log(await response.json());
// }
