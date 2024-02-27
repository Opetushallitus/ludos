import { ContentFormAction, ContentType, Exam, PublishState, TeachingLanguage } from '../types'
import { certificateSchemaByExam, CommonCertificateFormType } from '../components/forms/schemas/certificateSchema'
import { useFormSubmission } from './useFormSubmission'
import { DefaultValues, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBlockFormCloseOrRefresh } from './useBlockFormCloseOrRefresh'
import { useState } from 'react'
import { createCertificate, updateCertificate } from '../request'
import { contentListPath } from '../components/LudosRoutes'
import { useMatch } from 'react-router-dom'

export function useCertificateForm<T extends CommonCertificateFormType>(
  exam: Exam,
  action: ContentFormAction,
  defaultValues: T
) {
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const [activeTab, setActiveTab] = useState<TeachingLanguage>('fi')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { submitFormData, submitError } = useFormSubmission(exam, ContentType.CERTIFICATE, isUpdate)

  const methods = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onBlur',
    resolver: zodResolver(certificateSchemaByExam[exam])
  })

  const {
    handleSubmit,
    getValues,
    formState: { isDirty }
  } = methods

  useBlockFormCloseOrRefresh(isDirty)

  async function submitCertificateData(certificate: T, newAttachmentFi: File | null, newAttachmentSv: File | null) {
    if (isUpdate && id) {
      return await updateCertificate(Number(id), certificate, newAttachmentFi, newAttachmentSv)
    } else {
      return await createCertificate(certificate, newAttachmentFi!, newAttachmentSv).then((res) => res.id)
    }
  }

  async function submitCertificate(
    publishState: PublishState,
    newAttachmentFi: File | null,
    newAttachmentSv: File | null
  ) {
    await handleSubmit(
      async (data: T) =>
        await submitFormData(
          getValues().publishState!,
          submitCertificateData,
          data,
          publishState,
          {
            returnLocation: contentListPath(exam, ContentType.CERTIFICATE)
          },
          newAttachmentFi,
          newAttachmentSv
        )
    )()
  }

  return {
    methods,
    isUpdate,
    submitCertificate,
    submitError,
    tab: {
      activeTab,
      setActiveTab
    },
    isDeleteModalOpen,
    setIsDeleteModalOpen
  }
}
