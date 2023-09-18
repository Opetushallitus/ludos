import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  CertificateIn,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  PublishState
} from '../../../../types'
import { useTranslation } from 'react-i18next'
import { createCertificate, updateCertificate } from '../../../../request'
import { useEffect, useState } from 'react'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { AttachmentSelector } from '../../formCommon/attachment/AttachmentSelector'
import { FormError } from '../../formCommon/FormErrors'
import { useFetch } from '../../../../hooks/useFetch'

type CertificateFormProps = {
  action: ContentFormAction
}

const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [newAttachment, setNewAttachment] = useState<File | null>(null)

  const exam = match!.params.exam as Exam
  const id = match!.params.id

  const { data: certificate } = useFetch<CertificateIn>(
    `${ContentTypeSingularEng.todistukset}/${exam.toUpperCase()}/${id}`,
    action === ContentFormAction.uusi
  )

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CertificateFormType>({ mode: 'onBlur', resolver: zodResolver(certificateSchema) })

  // set initial values
  useEffect(() => {
    if (certificate) {
      reset({
        ...certificate,
        exam: exam.toUpperCase() as Exam
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
    }
    setValue('certificateHasAttachment', !!certificate)
  }, [certificate, exam, reset, setValue])

  async function submitCertificate({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: CertificateFormType) => {
      const certificateIn = { ...data, publishState }

      try {
        setLoading(true)
        let resultId: string
        // When updating we need to have the certificate
        if (action === ContentFormAction.muokkaus && certificate) {
          await updateCertificate(certificate.id, certificateIn, newAttachment)
          resultId = certificate.id.toString()
        } else {
          const { id } = await createCertificate<{ id: string }>(certificateIn, newAttachment!)
          resultId = id
        }
        setSubmitError('')

        navigate(`/${exam}/${ContentType.todistukset}/${resultId}`)
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }

  const nameError = errors.name?.message
  const contentError = errors.description?.message
  const fileError = errors.certificateHasAttachment?.message

  function handleNewAttachmentSelected(newAttachment: AttachmentData[]) {
    const file = newAttachment[0].file
    if (file) {
      setNewAttachment(file)
      setValue('certificateHasAttachment', true)
    }
  }

  const currentAttachment = (): AttachmentData[] | AttachmentData | undefined => {
    if (newAttachment) {
      return {
        file: newAttachment,
        name: newAttachment.name
      }
    } else if (certificate?.attachment) {
      return {
        attachment: certificate.attachment,
        name: certificate.attachment.name
      }
    } else {
      return undefined
    }
  }

  return (
    <div className="ludos-form">
      <FormHeader action={action} contentType={ContentType.todistukset} name={certificate?.name} />

      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <TextInput id="name" register={register} required error={!!nameError}>
          {t('form.todistuksennimi')}
        </TextInput>
        <FormError error={nameError} />

        <TextAreaInput id="description" register={register} required error={!!contentError}>
          {t('form.todistuksenkuvaus')}
        </TextAreaInput>
        <FormError error={contentError} />

        <div className="mb-2 mt-6 font-semibold">{t('form.todistus')}</div>
        <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

        <AttachmentSelector
          contentType={ContentType.todistukset}
          attachmentData={currentAttachment()}
          handleNewAttachmentSelected={handleNewAttachmentSelected}
          language="fi"
        />

        <FormError error={fileError} />
      </form>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitCertificate({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitCertificate({ publishState: PublishState.Published })}
        errorMessage={submitError}
        isLoading={loading}
      />
    </div>
  )
}

export default CertificateForm
