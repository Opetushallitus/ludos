#!/usr/bin/env -S deno run --allow-net

const BASE_URL = 'http://localhost:8080/api'

const headers = {
  'Content-Type': 'application/json'
}

const sukoData = {
  nameFi: 'Suko Assignment Fi',
  nameSv: 'Suko Assignment Sv',
  contentFi: 'This is a Suko assignment. Fi',
  contentSv: 'This is a Suko assignment. Sv',
  state: 'PUBLISHED',
  exam: 'SUKO',
  contentType: '',
  assignmentType: 'LUKEMINEN'
}

const puhviData = {
  nameFi: 'Puhvi Assignment Fi',
  nameSv: 'Puhvi Assignment Sv',
  contentFi: 'This is a Puhvi assignment. Fi',
  contentSv: 'This is a Puhvi assignment. Sv',
  state: 'PUBLISHED',
  exam: 'PUHVI',
  contentType: ''
}

const ldData = {
  nameFi: 'LD Assignment Fi',
  nameSv: 'LD Assignment Sv',
  contentFi: 'This is an LD assignment. Fi',
  contentSv: 'This is an LD assignment. Sv',
  state: 'PUBLISHED',
  exam: 'LD',
  contentType: ''
}

const numAssignments = 30
const contentTypes = ['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES']

const seedData = async () => {
  console.time('seedData')
  const examsArr = Object.entries({ SUKO: sukoData, PUHVI: puhviData, LD: ldData })
  const promises = []

  for (const [exam, data] of examsArr) {
    const origNameFi = data.nameFi
    const origNameSv = data.nameSv

    for (const contentType of contentTypes) {
      for (let i = 0; i < numAssignments; i++) {
        const nameFi = `${origNameFi} ${contentType.toLowerCase()} ${
          exam === 'SUKO' ? data['assignmentType'].toLowerCase() : ''
        } ${i + 1}`

        const nameSv = `${origNameSv} ${contentType.toLowerCase()} ${
          exam === 'SUKO' ? data['assignmentType'].toLowerCase() : ''
        } ${i + 1}`

        const body = {
          ...data,
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
              console.log(`${contentType} created: ${data.nameFi}`)
            } else {
              console.log(`Error creating ${contentType}: ${await response.text()}`)
            }
          })
          .catch((error) => {
            console.log(`Catch error creating ${contentType}: ${error.message}`)
          })

        promises.push(promise)
      }
    }
  }

  await Promise.allSettled(promises)
  console.timeEnd('seedData')
}

void seedData()
