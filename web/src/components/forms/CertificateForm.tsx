import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import { AttachmentData, ContentFormAction, ContentType, ContentTypeSingularEng, Exam, PublishState } from '../../types'
import { createCertificate, fetchData, updateCertificate } from '../../request'
import { useState } from 'react'
import { CertificateFormType, certificateSchema } from './schemas/certificateSchema'
import { TextInput } from '../TextInput'
import { TextAreaInput } from '../TextAreaInput'
import { FormHeader } from './formCommon/FormHeader'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { AttachmentSelector } from './formCommon/attachment/AttachmentSelector'
import { FormError } from './formCommon/FormErrors'
import { NotificationEnum, useNotification } from '../../contexts/NotificationContext'
import { contentListPath, contentPagePath } from '../LudosRoutes'
import { DeleteModal } from '../modal/DeleteModal'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

type CertificateFormProps = {
  action: ContentFormAction
}

const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t, lt } = useLudosTranslation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const { setNotification } = useNotification()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [newAttachment, setNewAttachment] = useState<File | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

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

  async function submitCertificateData(certificate: CertificateFormType) {
    if (isUpdate && id) {
      return await updateCertificate(Number(id), certificate, newAttachment)
    } else {
      return await createCertificate(certificate, newAttachment!).then((res) => res.id)
    }
  }

  function setSuccessNotification(newPublishState: PublishState) {
    const currentState = watchPublishState as typeof PublishState.Published | typeof PublishState.Draft

    setNotification({
      message: isUpdate
        ? lt.contentUpdateSuccessNotification[ContentType.todistukset][currentState][newPublishState]
        : lt.contentCreateSuccessNotification[ContentType.todistukset][
            newPublishState as typeof PublishState.Published | typeof PublishState.Draft
          ],
      type: NotificationEnum.success
    })
  }

  function handleSuccess(newPublishState: PublishState, resultId: number) {
    setSubmitError('')
    setSuccessNotification(newPublishState)

    if (newPublishState === PublishState.Deleted) {
      return navigate(contentListPath(exam, ContentType.todistukset), {
        replace: true // so that user cannot back navigate to edit deleted certificate
      })
    }

    navigate(contentPagePath(exam, ContentType.todistukset, resultId), {
      state: { returnLocation: contentListPath(exam, ContentType.todistukset) }
    })
  }

  function setErrorNotification(publishState: PublishState) {
    setNotification({
      message:
        publishState === PublishState.Deleted
          ? t('form.notification.todistuksen-poisto.epaonnistui')
          : t('form.notification.todistuksen-tallennus.epaonnistui'),
      type: NotificationEnum.error
    })
  }

  async function submitCertificate(publishState: PublishState) {
    await handleSubmit(async (data: CertificateFormType) => {
      const certificate = { ...data, publishState }

      try {
        setIsSubmitting(true)
        const resultId = await submitCertificateData(certificate)
        setSubmitError('')
        handleSuccess(publishState, resultId)
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        setErrorNotification(publishState)
      } finally {
        setIsSubmitting(false)
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
          onSubmitClick: () => submitCertificate(PublishState.Published),
          onSaveDraftClick: () => submitCertificate(PublishState.Draft),
          onDeleteClick: () => setOpenDeleteModal(true)
        }}
        state={{
          isUpdate,
          isSubmitting,
          publishState: watchPublishState
        }}
        formHasValidationErrors={Object.keys(errors).length > 0}
        errorMessage={submitError}
      />

      <DeleteModal
        modalTitle={lt.contentDeleteModalTitle[ContentType.todistukset]}
        open={openDeleteModal}
        onDeleteAction={() => submitCertificate(PublishState.Deleted)}
        onClose={() => setOpenDeleteModal(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText[ContentType.todistukset](watchName)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}

export default CertificateForm
