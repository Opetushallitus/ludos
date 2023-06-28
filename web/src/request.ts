import { Exam } from './types'
import { InstructionFormType } from './components/exam/instruction/form/instructionSchema'
import { CertificateFormType } from './components/exam/certificate/form/certificateSchema'
import { ASSIGNMENT_URL, CERTIFICATE_URL, INSTRUCTION_URL } from './constants'

const doRequest = async (url: string, method: string, body?: string) =>
  await fetch(url, {
    method,
    body,
    headers: { 'Content-Type': 'application/json' }
  })

export async function postAssignment<T>(body: T): Promise<{ id: string }> {
  const result = await doRequest(ASSIGNMENT_URL, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateAssignment<T>(exam: Exam, id: number, body: T): Promise<string> {
  const result = await doRequest(`${ASSIGNMENT_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function postInstruction<T>(body: InstructionFormType): Promise<T> {
  const result = await doRequest(INSTRUCTION_URL, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateInstruction<T>(exam: Exam, id: number, body: InstructionFormType): Promise<T> {
  const result = await doRequest(`${INSTRUCTION_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function postCertificate<T>(body: CertificateFormType): Promise<T> {
  const result = await doRequest(CERTIFICATE_URL, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateCertificate<T>(exam: Exam, id: number, body: CertificateFormType): Promise<void> {
  const result = await doRequest(`${CERTIFICATE_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }
}

export async function uploadFile<T>(file: File, oldFileKey?: string): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)

  if (oldFileKey) {
    formData.append('oldFileKey', oldFileKey.toString())
  }

  const result = await fetch(`${CERTIFICATE_URL}/upload`, {
    method: 'POST',
    body: formData
  })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}
