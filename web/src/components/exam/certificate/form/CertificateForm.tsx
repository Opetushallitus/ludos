import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Exam, PublishState, ContentTypeEng, CertificateIn } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { createCertificate, updateCertificate } from '../../../../request'
import { useEffect, useState } from 'react'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { AttachmentSelector } from '../../formCommon/AttachmentSelector'
import { FormError } from '../../formCommon/FormErrors'

type CertificateFormProps = {
  action: 'new' | 'update'
}

export const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [loading, setLoading] = useState(false)
  const [newAttachment, setNewAttachment] = useState<File | null>(null)

  const exam = match!.params.exam as Exam

  const certificate = state?.data as CertificateIn | undefined

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
        if (action === 'update' && certificate) {
          await updateCertificate<void>(exam, certificate.id, certificateIn, newAttachment)
          resultId = certificate.id.toString()
        } else {
          const { id } = await createCertificate<{ id: string }>(certificateIn, newAttachment!)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }

  const nameError = errors.name?.message
  const contentError = errors.description?.message
  const fileError = errors.certificateHasAttachment?.message

  function handleNewAttachmentSelected(newAttachment: File) {
    setNewAttachment(newAttachment)
    setValue('certificateHasAttachment', true)
  }

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={ContentTypeEng.TODISTUKSET} name={certificate?.name} />

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
          currentAttachment={certificate?.attachment ?? null}
          newAttachment={newAttachment}
          setNewAttachment={handleNewAttachmentSelected}
        />

        <FormError error={fileError} />
      </form>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitCertificate({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitCertificate({ publishState: PublishState.Published })}
        isLoading={loading}
      />
    </div>
  )
}
