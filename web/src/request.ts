import { InstructionFormType } from './components/forms/schemas/instructionSchema'
import { CertificateFormType } from './components/forms/schemas/certificateSchema'
import { ASSIGNMENT_URL, BASE_API_URL, CERTIFICATE_URL, INSTRUCTION_URL } from './constants'
import { AttachmentDtoOut, AttachmentLanguage, Exam, ImageDtoOut, MapWithFileKeyAndMetadata } from './types'

export class SessionExpiredFetchError extends Error {
  constructor() {
    super('')
    this.name = 'SessionExpiredFetchError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionExpiredFetchError)
    }
  }
}

const doRequest = async (
  url: string,
  method: string,
  body?: string | FormData,
  headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
) => {
  const response = await fetch(url, {
    method,
    body,
    headers,
    redirect: 'manual'
  })

  if (response.type === 'opaqueredirect') {
    throw new SessionExpiredFetchError()
  }

  return response
}

export async function fetchData<T>(url: string): Promise<T> {
  const fullUrl = `/api/${url}`
  const response = await doRequest(fullUrl, 'GET')

  if (!response.ok) {
    throw new Error(`Error fetching data from ${fullUrl}, status=${response.status}`)
  }

  return (await response.json()) as T
}

export async function createAssignment<T>(body: T): Promise<{ id: number }> {
  const result = await doRequest(ASSIGNMENT_URL, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateAssignment<T>(id: number, body: T): Promise<number> {
  const result = await doRequest(`${ASSIGNMENT_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createInstruction(
  instructionIn: InstructionFormType,
  attachmentWithMetadata: { file: File; name: string; language: AttachmentLanguage }[]
): Promise<{ id: number }> {
  const formData = new FormData()

  const instructionPart = new Blob([JSON.stringify(instructionIn)], { type: 'application/json' })

  formData.append('instruction', instructionPart)

  attachmentWithMetadata.forEach((it) => {
    formData.append('attachments', it.file)
    formData.append(
      'attachments-metadata',
      JSON.stringify({
        name: it.name,
        language: it.language.toUpperCase()
      })
    )
  })

  const result = await doRequest(INSTRUCTION_URL, 'POST', formData, { type: 'multipart/form-data' })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateInstruction(
  id: number,
  body: InstructionFormType,
  mapWithFileAndMetadata: MapWithFileKeyAndMetadata
): Promise<number> {
  const formData = new FormData()

  const instructionPart = new Blob([JSON.stringify(body)], { type: 'application/json' })

  formData.append('instruction', instructionPart)

  mapWithFileAndMetadata.forEach((metadata, fileKey) => {
    formData.append(
      'attachments-metadata',
      JSON.stringify({
        name: metadata.name,
        language: metadata.language.toUpperCase(),
        fileKey
      })
    )
  })

  const result = await doRequest(`${INSTRUCTION_URL}/${id}`, 'PUT', formData, { type: 'multipart/form-data' })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function uploadInstructionAttachment(
  instructionId: number,
  exam: Exam,
  newAttachment: { file: File; name: string; lang: AttachmentLanguage }
): Promise<AttachmentDtoOut> {
  const formData = new FormData()

  formData.append('file', newAttachment.file)
  formData.append(
    'attachment-metadata',
    JSON.stringify({
      name: newAttachment.name,
      language: newAttachment.lang.toUpperCase()
    })
  )

  const result = await doRequest(`${INSTRUCTION_URL}/attachment/${exam}/${instructionId}`, 'POST', formData, {
    type: 'multipart/form-data'
  })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export function deleteInstructionAttachment(attachmentFileKey: string) {
  void doRequest(`${INSTRUCTION_URL}/attachment/${attachmentFileKey}`, 'DELETE')
}

export async function createCertificate(
  certificateIn: CertificateFormType,
  newAttachmentFi: File,
  newAttachmentSv: File | null
): Promise<{ id: number }> {
  const formData = new FormData()

  const certificatePart = new Blob([JSON.stringify(certificateIn)], { type: 'application/json' })
  formData.append('certificate', certificatePart)
  formData.append('attachmentFi', newAttachmentFi)
  if (newAttachmentSv) {
    formData.append('attachmentSv', newAttachmentSv)
  }

  const result = await doRequest(CERTIFICATE_URL, 'POST', formData, { type: 'multipart/form-data' })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function updateCertificate(
  id: number,
  certificateIn: CertificateFormType,
  newAttachmentFi: File | null,
  newAttachmentSv: File | null
): Promise<number> {
  const formData = new FormData()

  const certificatePart = new Blob([JSON.stringify(certificateIn)], { type: 'application/json' })
  formData.append('certificate', certificatePart)
  if (newAttachmentFi) {
    formData.append('attachmentFi', newAttachmentFi)
  }
  if (newAttachmentSv) {
    formData.append('attachmentSv', newAttachmentSv)
  }

  const result = await doRequest(`${CERTIFICATE_URL}/${id}`, 'PUT', formData, { type: 'multipart/form-data' })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return result.json()
}
export async function getKoodistos(language: string): Promise<Response> {
  return await doRequest(`${BASE_API_URL}/koodisto/${language.toUpperCase()}`, 'GET')
}

export async function getUserDetails(): Promise<Response> {
  return await doRequest(`${BASE_API_URL}/auth/user`, 'GET')
}

export async function getUserFavoriteCount(): Promise<Response> {
  return await doRequest(`${BASE_API_URL}/assignment/favoriteCount`, 'GET')
}

export async function setAssignmentFavorite(exam: Exam, assignmentId: number, isFavorite: boolean): Promise<number> {
  const result = await doRequest(
    `${BASE_API_URL}/assignment/${exam}/${assignmentId}/favorite`,
    'PUT',
    JSON.stringify({ suosikki: isFavorite })
  )
  if (!result.ok) {
    throw new Error(await result.text())
  }

  return result.json()
}

export async function uploadImage(file: File): Promise<ImageDtoOut> {
  const formData = new FormData()

  formData.append('file', file)

  const result = await doRequest(`${BASE_API_URL}/image`, 'POST', formData, {
    type: 'multipart/form-data'
  })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}
