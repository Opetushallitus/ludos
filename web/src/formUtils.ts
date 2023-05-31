import { Exam } from './types'
import { InstructionFormType } from './components/exam/instruction/form/instructionSchema'
import { CertificateFormType } from './components/exam/certificate/form/certificateSchema'
import { assignmentUrl, baseApiUrl, certificateUrl, instructionUrl } from './constants'

const doRequest = async (url: string, method: string, body?: string) =>
  await fetch(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  })

export async function postAssignment<T>(body: T): Promise<{ id: string }> {
  const result = await doRequest(assignmentUrl, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateAssignment<T>(exam: Exam, id: number, body: T): Promise<string> {
  const result = await doRequest(`${assignmentUrl}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function postInstruction<T>(body: InstructionFormType): Promise<T> {
  const result = await doRequest(instructionUrl, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}

export async function updateInstruction<T>(exam: Exam, id: number, body: InstructionFormType): Promise<T> {
  const result = await doRequest(`${instructionUrl}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error()
  }

  return await result.json()
}
export async function postCertificate<T>(body: CertificateFormType): Promise<T> {
  const result = await doRequest(certificateUrl, 'POST', JSON.stringify(body))

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
