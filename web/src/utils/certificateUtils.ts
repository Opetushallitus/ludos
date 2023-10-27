import {
  BaseOut,
  CertificateDtoOut,
  ContentType,
  Exam,
  LdCertificateDtoOut,
  SukoOrPuhviCertificateDtoOut
} from '../types'

export const isLdCertificate = (certificate: CertificateDtoOut, exam: Exam): certificate is LdCertificateDtoOut =>
  exam === Exam.LD && 'aineKoodiArvo' in certificate

export const isSukoOrPuhviCertificate = (
  certificate: CertificateDtoOut,
  exam: Exam
): certificate is SukoOrPuhviCertificateDtoOut =>
  (exam === Exam.SUKO || exam === Exam.PUHVI) && 'description' in certificate

export const isCertificate = (
  data: BaseOut,
  contentType: ContentType
): data is SukoOrPuhviCertificateDtoOut | LdCertificateDtoOut => contentType === ContentType.todistukset
