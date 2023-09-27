import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  PublishState
} from '../../../../types'
import { useTranslation } from 'react-i18next'
import { createCertificate, fetchData, updateCertificate } from '../../../../request'
import { useState } from 'react'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { AttachmentSelector } from '../../formCommon/attachment/AttachmentSelector'
import { FormError } from '../../formCommon/FormErrors'
import { NotificationEnum, useNotification } from '../../../../NotificationContext'
import { contentListPath, contentPagePath } from '../../../routes/LudosRoutes'

type CertificateFormProps = {
  action: ContentFormAction
}

const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const { setNotification } = useNotification()

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [newAttachment, setNewAttachment] = useState<File | null>(null)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CertificateFormType>({
    defaultValues: isUpdate
      ? async () => fetchData(`${ContentTypeSingularEng.todistukset}/${exam}/${id}`)
      : {
          exam
        },
    mode: 'onBlur',
    resolver: zodResolver(certificateSchema)
  })

  const watchName = watch('name')
  const watchAttachment = watch('attachment')
  const watchPublishState = watch('publishState')

  async function submitCertificate({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: CertificateFormType) => {
      const certificateIn = { ...data, publishState }

      try {
        setIsLoading(true)
        let resultId: number
        if (isUpdate && id) {
          resultId = await updateCertificate(Number(id), certificateIn, newAttachment)
        } else {
          resultId = await createCertificate(certificateIn, newAttachment!).then((res) => res.id)
        }

        setSubmitError('')

        if (publishState === PublishState.Draft) {
          setNotification({
            message: isUpdate
              ? t('form.notification.todistuksen-tallennus.palautettu-luonnostilaan')
              : t('form.notification.todistuksen-tallennus.luonnos-onnistui'),
            type: NotificationEnum.success
          })
        }

        if (publishState === PublishState.Published) {
          setNotification({
            message: isUpdate
              ? t('form.notification.todistuksen-tallennus.onnistui')
              : t('form.notification.todistuksen-tallennus.julkaisu-onnistui'),
            type: NotificationEnum.success
          })
        }

        navigate(contentPagePath(exam, ContentType.todistukset, resultId), {
          state: { returnLocation: contentListPath(exam, ContentType.todistukset) }
        })
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        setNotification({
          message: t('form.notification.todistuksen-tallennus.epaonnistui'),
          type: NotificationEnum.error
        })
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    })()
  }

  function handleNewAttachmentSelected(newAttachment: AttachmentData[]) {
    const file = newAttachment[0].file
    if (file) {
      setNewAttachment(file)
      setValue('attachment', {
        fileName: file.name,
        name: file.name,
        fileKey: ''
      })
    }
  }

  function currentAttachment(): AttachmentData | undefined {
    if (newAttachment) {
      return {
        file: newAttachment,
        name: newAttachment.name
      }
    }

    if (watchAttachment) {
      return {
        attachment: {
          name: watchAttachment.fileName,
          fileName: watchAttachment.fileName,
          fileKey: watchAttachment.fileKey,
          fileUploadDate: watchAttachment.fileUploadDate,
          language: watchAttachment.language || 'FI'
        },
        name: watchAttachment.name || ''
      }
    }
  }

  const nameError = errors.name?.message
  const contentError = errors.description?.message
  const fileError = errors.attachment?.message

  return (
    <div className="ludos-form">
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkotodistus') : watchName}
        description={action === ContentFormAction.uusi ? t('form.kuvaustodistus') : t('form.muokkauskuvaus')}
      />
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
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
        actions={{
          onSubmitClick: () => submitCertificate({ publishState: PublishState.Published }),
          onSaveDraftClick: () => submitCertificate({ publishState: PublishState.Draft })
        }}
        state={{
          isUpdate,
          isLoading,
          publishState: watchPublishState
        }}
        notValidFormMessageKey={Object.keys(errors).length > 0 ? 'form.todistuksen-lisays-epaonnistui' : ''}
        errorMessage={submitError}
      />
    </div>
  )
}

export default CertificateForm
