import { BaseOut, Exam, LdCertificateDtoOut, PuhviCertificateDtoOut, SukoCertificateDtoOut } from '../types'

export const isSukoCertificate = (data: BaseOut): data is SukoCertificateDtoOut =>
  data.exam === Exam.SUKO && !('aineKoodiArvo' in data)

export const isLdCertificate = (data: BaseOut): data is LdCertificateDtoOut =>
  data.exam === Exam.LD && 'aineKoodiArvo' in data

export const isPuhviCertificate = (data: BaseOut): data is PuhviCertificateDtoOut =>
  data.exam === Exam.PUHVI && !('aineKoodiArvo' in data)

export const isCertificate = (
  data: BaseOut
): data is LdCertificateDtoOut | PuhviCertificateDtoOut | SukoCertificateDtoOut =>
  isLdCertificate(data) || isPuhviCertificate(data) || isSukoCertificate(data)
