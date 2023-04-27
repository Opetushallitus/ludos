const BASE_URL = 'http://localhost:8080/api/assignment'

const headers = {
  'Content-Type': 'application/json'
}

const sukoData = {
  name: 'Suko Assignment',
  content: 'This is a Suko assignment.',
  state: 'PUBLISHED',
  exam: 'SUKO',
  examType: 'ASSIGNMENTS',
  assignmentType: 'KUUNTELU'
}

const puhviData = {
  name: 'Puhvi Assignment',
  content: 'This is a Puhvi assignment.',
  state: 'PUBLISHED',
  exam: 'PUHVI',
  examType: 'ASSIGNMENTS'
}

const ldData = {
  name: 'LD Assignment',
  content: 'This is an LD assignment.',
  state: 'PUBLISHED',
  exam: 'LD',
  examType: 'ASSIGNMENTS'
}

const seedData = async () => {
  const numAssignments = 30

  for (const [exam, data] of Object.entries({ SUKO: sukoData, PUHVI: puhviData, LD: ldData })) {
    const origName = data.name

    for (let i = 0; i < numAssignments; i++) {
      data.name = `${origName} ${i + 1}`
      data.exam = exam
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (response.ok) {
        console.log(`Assignment created: ${data.name}`)
      } else {
        console.log(`Error creating assignment: ${await response.text()}`)
      }
    }
  }
}

void seedData()
