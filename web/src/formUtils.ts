import { Exam } from './types'
import { SukoAssignmentForm } from './components/exam/assignment/sukoSchema'

const doRequest = async (url: string, method: string, body?: string) =>
  await fetch(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  })

export async function postAssignment<T>(body: SukoAssignmentForm): Promise<T> {
  const result = await doRequest('/api/assignment', 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateAssignment<T>(exam: Exam, id: number, body: SukoAssignmentForm): Promise<T> {
  const result = await doRequest(`/api/assignment/${exam!.toUpperCase()}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export const assignmentTypes = [
  {
    id: 'LUKEMINEN',
    label: 'Tekstin lukeminen'
  },
  {
    id: 'TEKSTIN_TIIVISTAMINEN',
    label: 'Tekstin tiivistäminen'
  },
  {
    id: 'KESKUSTELU',
    label: 'Ryhmäkeskustelu'
  }
]
