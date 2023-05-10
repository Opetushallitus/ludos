import { Exam } from './types'
import { AssignmentFormType } from './components/exam/assignment/form/assignmentSchema'
import { InstructionFormType } from './components/exam/instruction/form/instructionSchema'
import { CertificateFormType } from './components/exam/certificate/form/certificateSchema'

const doRequest = async (url: string, method: string, body?: string) =>
  await fetch(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  })

export async function postAssignment<T>(body: AssignmentFormType): Promise<T> {
  const result = await doRequest('/api/assignment', 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateAssignment<T>(exam: Exam, id: number, body: AssignmentFormType): Promise<T> {
  const result = await doRequest(`/api/assignment/${exam!.toUpperCase()}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function postInstruction<T>(body: InstructionFormType): Promise<T> {
  const result = await doRequest('/api/instruction', 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateInstruction<T>(exam: Exam, id: number, body: InstructionFormType): Promise<T> {
  const result = await doRequest(`/api/instruction/${exam!.toUpperCase()}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}
export async function postCertificate<T>(body: CertificateFormType): Promise<T> {
  const result = await doRequest('/api/certificate', 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateCertificate<T>(exam: Exam, id: number, body: CertificateFormType): Promise<T> {
  const result = await doRequest(`/api/certificate/${exam!.toUpperCase()}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}
