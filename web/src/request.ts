import { InstructionFormType } from './components/exam/instruction/form/instructionSchema'
import { CertificateFormType } from './components/exam/certificate/form/certificateSchema'
import { ASSIGNMENT_URL, BASE_API_URL, CERTIFICATE_URL, INSTRUCTION_URL } from './constants'

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

export async function updateAssignment<T>(id: number, body: T): Promise<string> {
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

export async function updateInstruction<T>(id: number, body: InstructionFormType): Promise<T> {
  const result = await doRequest(`${INSTRUCTION_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createCertificate<T>(certificateIn: CertificateFormType, newAttachment: File): Promise<T> {
  const formData = new FormData()

  const certificatePart = new Blob([JSON.stringify(certificateIn)], { type: 'application/json' })
  formData.append('certificate', certificatePart)
  formData.append('attachment', newAttachment)

  const result = await fetch(CERTIFICATE_URL, { method: 'POST', body: formData })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateCertificate(
  id: number,
  certificateIn: CertificateFormType,
  newAttachment: File | null
): Promise<void> {
  const formData = new FormData()

  const certificatePart = new Blob([JSON.stringify(certificateIn)], { type: 'application/json' })
  formData.append('certificate', certificatePart)
  if (newAttachment) {
    formData.append('attachment', newAttachment)
  }

  const result = await fetch(`${CERTIFICATE_URL}/${id}`, { method: 'PUT', body: formData })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return
}
export async function getKoodistos(language: string): Promise<Response> {
  return await fetch(`${BASE_API_URL}/koodisto/${language.toUpperCase()}`, { method: 'GET' })
}

export async function getUserDetails(): Promise<Response> {
  return await fetch(`${BASE_API_URL}/auth/user`, { method: 'GET' })
}
