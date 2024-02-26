import { ContentBaseOut, Exam, LdCertificateDtoOut, PuhviCertificateDtoOut, SukoCertificateDtoOut } from '../types'

export const isSukoCertificate = (data: ContentBaseOut): data is SukoCertificateDtoOut =>
  data.exam === Exam.SUKO && !('aineKoodiArvo' in data) && 'descriptionFi' in data && 'attachmentFi' in data

export const isLdCertificate = (data: ContentBaseOut): data is LdCertificateDtoOut =>
  data.exam === Exam.LD && 'aineKoodiArvo' in data

export const isPuhviCertificate = (data: ContentBaseOut): data is PuhviCertificateDtoOut =>
  data.exam === Exam.PUHVI && !('aineKoodiArvo' in data)

export const isCertificate = (
  data: ContentBaseOut
): data is LdCertificateDtoOut | PuhviCertificateDtoOut | SukoCertificateDtoOut =>
  isLdCertificate(data) || isPuhviCertificate(data) || isSukoCertificate(data)
