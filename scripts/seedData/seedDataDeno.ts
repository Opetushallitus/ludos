#!/usr/bin/env -S deno run --allow-net

const BASE_URL = 'http://localhost:8080/api'

const headers = {
  'Content-Type': 'application/json'
}

const commonFields = {
  instructionFi: 'Instructions Fi',
  instructionSv: 'Instructions Sv',
  publishState: 'PUBLISHED',
  laajaalainenOsaaminenKoodiArvos: ['04']
}

const sukoData = {
  nameFi: 'Suko Assignment Fi',
  nameSv: 'Suko Assignment Sv',
  contentFi: 'This is a Suko assignment. Fi',
  contentSv: 'This is a Suko assignment. Sv',
  exam: 'SUKO',
  aiheKoodiArvos: ['001', '002'],
  assignmentTypeKoodiArvo: '001',
  oppimaaraKoodiArvo: 'MU',
  tavoitetasoKoodiArvo: '0004',
  ...commonFields
}

const puhviData = {
  nameFi: 'Puhvi Assignment Fi',
  nameSv: 'Puhvi Assignment Sv',
  contentFi: 'This is a Puhvi assignment. Fi',
  contentSv: 'This is a Puhvi assignment. Sv',
  exam: 'PUHVI',
  assignmentTypeKoodiArvo: '001',
  lukuvuosiKoodiArvos: ['20202021', '20242025'],
  ...commonFields
}

const ldData = {
  nameFi: 'LD Assignment Fi',
  nameSv: 'LD Assignment Sv',
  contentFi: 'This is an LD assignment. Fi',
  contentSv: 'This is an LD assignment. Sv',
  exam: 'LD',
  lukuvuosiKoodiArvos: ['20202021', '20242025'],
  aineKoodiArvo: '1',
  ...commonFields
}

const numAssignments = 30
const contentTypes = ['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES']

const modifyData = (data) => {
  const modifiedData = { ...data }

  if (data.aiheKoodiArvos) {
    // Add all values from "001" to "0017" to aiheKoodiArvos
    modifiedData.aiheKoodiArvos = Array.from({ length: 17 }, (_, index) => {
      return (index + 1).toString().padStart(3, '0')
    })
  }

  if (data.lukuvuosiKoodiArvos) {
    modifiedData.lukuvuosiKoodiArvos = ['20212022', '20222023', '20232024']
  }

  if (data.aineKoodiArvo) {
    modifiedData.aineKoodiArvo = '5'
  }

  if (data.assignmentTypeKoodiArvo) {
    modifiedData.assignmentTypeKoodiArvo = '002'
  }

  if (data.aiheKoodiArvos) {
    modifiedData.aiheKoodiArvos = ['005']
  }

  if (data.oppimaaraKoodiArvo) {
    modifiedData.oppimaaraKoodiArvo = 'AI'
  }

  if (data.tavoitetasoKoodiArvo) {
    modifiedData.tavoitetasoKoodiArvo = '0008'
  }

  return modifiedData
}

const seedData = async () => {
  console.time('seedData')
  const examsArr = Object.entries({ SUKO: sukoData, PUHVI: puhviData, LD: ldData })
  const promises = []
  const successLogs = []
  const failureLogs = []

  for (const [exam, data] of examsArr) {
    const origNameFi = data.nameFi
    const origNameSv = data.nameSv

    for (const contentType of contentTypes) {
      for (let i = 0; i < numAssignments; i++) {
        const nameFi = `${origNameFi} ${contentType.toLowerCase()} ${i + 1}`

        const nameSv = `${origNameSv} ${contentType.toLowerCase()} ${i + 1}`

        const everyThird = (i + 1) % 3 === 0

        const modifiedData = everyThird ? modifyData(data) : data

        const body = {
          ...modifiedData,
          nameFi,
          nameSv,
          contentType,
          exam
        }

        let url = BASE_URL

        if (contentType === 'ASSIGNMENTS') {
          url += '/assignment'
        } else if (contentType === 'INSTRUCTIONS') {
          url += '/instruction'
        } else {
          url += '/certificate'
        }

        const promise = fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        })
          .then(async (response) => {
            if (response.ok) {
              successLogs.push(`${contentType} created: ${data.nameFi}`)
            } else {
              failureLogs.push(`Error creating ${contentType}: ${await response.text()}`)
            }
          })
          .catch((error) => {
            failureLogs.push(`Catch error creating ${contentType}: ${error.message}`)
          })

        promises.push(promise)
      }
    }
  }

  await Promise.allSettled(promises)
  console.timeEnd('seedData')
  console.log('Finished seeding data, number of promises: ' + promises.length)
  console.log('Successes:' + successLogs.length)
  console.log('Failures:' + failureLogs.length)

  let failureMessages = new Set()

  failureLogs.forEach((log) => failureMessages.add(log))

  console.log('failureMessages', JSON.stringify(Array.from(failureMessages)))
}

void seedData()
