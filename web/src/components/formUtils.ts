import { Exam } from '../types'

const doRequest = async (url: string, method: string, body?: string) =>
  await fetch(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  })

export async function postAssignment<T>(body: string): Promise<T> {
  const result = await doRequest('/api/assignment', 'POST', body)

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateAssignment<T>(exam: Exam, id: number, body: string): Promise<T> {
  const result = await doRequest(`/api/assignment/${exam!.toUpperCase()}/${id}`, 'PUT', body)

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}
