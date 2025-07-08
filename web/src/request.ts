import { getCookie } from 'typescript-cookie'
import { z } from 'zod'
import { CommonCertificateFormType } from './components/forms/schemas/certificateSchema'
import { InstructionFormType } from './components/forms/schemas/instructionSchema'
import { FavoriteToggleModalFormType } from './components/modal/favoriteModal/favoriteToggleModalFormSchema'
import { ASSIGNMENT_URL, BASE_API_URL, CERTIFICATE_URL, INSTRUCTION_URL } from './constants'
import { LanguageKoodistoMap } from './contexts/LudosContext'
import { AttachmentData, ContentType, ContentTypeSingularEn, Exam, ImageDtoOut } from './types'

export class SessionExpiredFetchError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredFetchError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SessionExpiredFetchError)
    }
  }
}

export class NonOkResponseFetchError extends Error {
  fullUrl: string
  code: number
  constructor(fullUrl: string, code: number) {
    super(`Response status from '${fullUrl}' was ${code}, expected 200 OK`)
    this.name = 'SessionExpiredFetchError'
    this.fullUrl = fullUrl
    this.code = code
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonOkResponseFetchError)
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
    headers: {
      ...headers,
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || ''
    },
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
    throw new NonOkResponseFetchError(fullUrl, response.status)
  }

  return (await response.json()) as T
}

export async function fetchDataOrReload<T>(url: string): Promise<T> {
  try {
    return await fetchData(url)
  } catch (e) {
    if (e instanceof SessionExpiredFetchError) {
      location.reload()
      throw SessionExpiredFetchError
    } else {
      throw e
    }
  }
}

export async function createAssignment<T>(body: T): Promise<{ id: number }> {
  const result = await doRequest(ASSIGNMENT_URL, 'POST', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createNewVersionOfAssignment<T>(id: number, body: T): Promise<number> {
  const result = await doRequest(`${ASSIGNMENT_URL}/${id}`, 'PUT', JSON.stringify(body))

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createInstruction<T>(
  instructionIn: InstructionFormType,
  attachmentWithMetadata: AttachmentData[]
): Promise<T> {
  const formData = new FormData()

  const instructionPart = new Blob([JSON.stringify(instructionIn)], { type: 'application/json' })

  formData.append('instruction', instructionPart)

  attachmentWithMetadata.forEach((it) => {
    formData.append('attachments', it.file!)
    formData.append(
      'attachments-metadata',
      JSON.stringify({
        name: it.name,
        language: it.language!.toUpperCase()
      })
    )
  })

  const result = await doRequest(INSTRUCTION_URL, 'POST', formData, { type: 'multipart/form-data' })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createNewVersionOfInstruction<T>(
  id: number,
  instructionIn: InstructionFormType,
  attachmentsToUpdate: AttachmentData[],
  attachmentsToUpload: AttachmentData[]
): Promise<T> {
  const formData = new FormData()

  const instructionPart = new Blob([JSON.stringify(instructionIn)], { type: 'application/json' })

  formData.append('instruction', instructionPart)

  attachmentsToUpload.forEach((it) => {
    formData.append('new-attachments', it.file!)
    formData.append(
      'new-attachments-metadata',
      JSON.stringify({
        name: it.name,
        language: it.language!.toUpperCase()
      })
    )
  })

  attachmentsToUpdate.forEach((it) => {
    formData.append(
      'attachments-metadata',
      JSON.stringify({
        name: it.name,
        language: it.language!.toUpperCase(),
        fileKey: it.attachment!.fileKey
      })
    )
  })

  const result = await doRequest(`${INSTRUCTION_URL}/${id}`, 'PUT', formData, {
    type: 'multipart/form-data'
  })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function createCertificate(
  certificateIn: CommonCertificateFormType,
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

export async function createNewVersionOfCertificate(
  id: number,
  certificateIn: CommonCertificateFormType,
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

export async function restoreOldContentVersion(
  exam: Exam,
  contentType: ContentType,
  id: number,
  version: number
): Promise<number> {
  const result = await doRequest(
    `${BASE_API_URL}/${ContentTypeSingularEn[contentType]}/${exam}/${id}/${version}/restore`,
    'POST',
    '{}'
  )

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return result.json()
}

export async function getKoodistos(): Promise<LanguageKoodistoMap> {
  try {
    const response = await doRequest(`${BASE_API_URL}/koodisto`, 'GET')
    if (!response.ok) {
      console.error('Error occurred while fetching koodistos:')
    }

    return await response.json()
  } catch (e) {
    console.error('Error occurred while fetching koodistos:', e)
    throw e
  }
}

export async function getUserDetailsRequest(): Promise<Response> {
  return await doRequest(`${BASE_API_URL}/auth/user`, 'GET')
}

export const featuresSchema = z.object({})
export type Features = z.infer<typeof featuresSchema>

export async function getFeatures(): Promise<Features> {
  const featuresResponse = await doRequest(`${BASE_API_URL}/config/features`, 'GET')
  return featuresSchema.parse(await featuresResponse.json())
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

export async function getUserFavoriteCount(): Promise<number> {
  try {
    const userFavoriteAssignmentCountResponse = await doRequest(`${ASSIGNMENT_URL}/favorites/count`, 'GET')

    if (userFavoriteAssignmentCountResponse.ok) {
      return await userFavoriteAssignmentCountResponse.json()
    } else {
      console.error('Could not fetch userFavoriteAssignmentCount')
      return -1
    }
  } catch (e) {
    console.error('Error occurred while fetching userFavoriteAssignmentCount:', e)
    return -1
  }
}

export async function setAssignmentFavorite(data: FavoriteToggleModalFormType): Promise<number> {
  const result = await doRequest(
    `${ASSIGNMENT_URL}/favorites/${data.exam}/${data.assignmentId}`,
    'PUT',
    JSON.stringify(data.favoriteFolderIds)
  )
  if (!result.ok) {
    throw new Error(await result.text())
  }

  return result.json()
}

export async function createFavoriteFolder(exam: Exam, name: string, parentId: number | null): Promise<number> {
  const result = await doRequest(
    `${ASSIGNMENT_URL}/favorites/${exam}/folder`,
    'POST',
    JSON.stringify({ name, parentId })
  )

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return result.json()
}

export async function updateFavoriteFolder(
  exam: Exam,
  folderId: number,
  name: string,
  parentId: number
): Promise<void> {
  const result = await doRequest(
    `${ASSIGNMENT_URL}/favorites/${exam}/folder/${folderId}`,
    'PUT',
    JSON.stringify({ name, parentId })
  )

  if (!result.ok) {
    throw new Error(await result.text())
  }
}

export async function deleteFavoriteFolder(exam: Exam, folderId: number): Promise<void> {
  const result = await doRequest(`${ASSIGNMENT_URL}/favorites/${exam}/folder/${folderId}`, 'DELETE')

  if (!result.ok) {
    throw new Error(await result.text())
  }
}
