const BASE_URL = 'http://localhost:8080/api/assignment'

const headers = {
  'Content-Type': 'application/json'
}

const sukoData = {
  name: 'Suko Assignment',
  content: 'This is a Suko assignment.',
  state: 'PUBLISHED',
  exam: 'SUKO',
  examType: '',
  assignmentType: 'KUUNTELU'
}

const puhviData = {
  name: 'Puhvi Assignment',
  content: 'This is a Puhvi assignment.',
  state: 'PUBLISHED',
  exam: 'PUHVI',
  examType: ''
}

const ldData = {
  name: 'LD Assignment',
  content: 'This is an LD assignment.',
  state: 'PUBLISHED',
  exam: 'LD',
  examType: ''
}

const numAssignments = 30
const examTypes = ['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES']

const seedData = async () => {
  const examsArr = Object.entries({ SUKO: sukoData, PUHVI: puhviData, LD: ldData })

  for (const [exam, data] of examsArr) {
    const origName = data.name

    for (const examType of examTypes) {
      for (let i = 0; i < numAssignments; i++) {
        const name = `${origName} ${examType.toLowerCase()} ${
          exam === 'SUKO' ? data['assignmentType'].toLowerCase() : ''
        } ${i + 1}`

        const body = {
          ...data,
          name,
          examType,
          exam
        }

        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        })

        if (response.ok) {
          console.log(`Assignment created: ${data.name}`)
        } else {
          console.log(`Error creating assignment: ${await response.text()}`)
        }
      }
    }
  }
}

void seedData()
