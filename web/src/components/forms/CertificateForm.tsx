import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  AttachmentLanguage,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  PublishState,
  TeachingLanguage
} from '../../types'
import { createCertificate, fetchData, SessionExpiredFetchError, updateCertificate } from '../../request'
import { TextInput } from '../TextInput'
import { TextAreaInput } from '../TextAreaInput'
import { FormHeader } from './formCommon/FormHeader'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { AttachmentSelector } from './formCommon/attachment/AttachmentSelector'
import { FormError } from './formCommon/FormErrors'
import { contentListPath } from '../LudosRoutes'
import { DeleteModal } from '../modal/DeleteModal'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { FormAineDropdown } from './formCommon/FormAineDropdown'
import { certificateFormDefaultValues, CertificateFormType, certificateSchema } from './schemas/certificateSchema'
import { LanguageTabs } from '../LanguageTabs'
import { BlockNavigation } from '../BlockNavigation'
import { useFormPrompt } from '../../hooks/useFormPrompt'
import { useFormSubmission } from './useFormSubmission'

type CertificateFormProps = {
  action: ContentFormAction
}

const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t, lt } = useLudosTranslation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const [activeTab, setActiveTab] = useState<TeachingLanguage>('fi')
  const [newAttachmentFi, setNewAttachmentFi] = useState<File | null>(null)
  const [newAttachmentSv, setNewAttachmentSv] = useState<File | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const { submitFormData, submitError } = useFormSubmission(exam, ContentType.todistukset, isUpdate)

  async function defaultValues<T>(): Promise<T> {
    if (isUpdate && id) {
      try {
        return await fetchData(`${ContentTypeSingularEng.todistukset}/${exam}/${id}`)
      } catch (e) {
        if (e instanceof SessionExpiredFetchError) {
          location.reload()
          throw SessionExpiredFetchError
        } else if (e instanceof Error) {
          throw Error(e.message)
        } else {
          throw Error('')
        }
      }
    } else {
      return { exam, ...certificateFormDefaultValues } as T
    }
  }

  const methods = useForm<CertificateFormType>({
    defaultValues,
    mode: 'onBlur',
    resolver: zodResolver(certificateSchema)
  })

  const {
    getValues,
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting }
  } = methods

  useFormPrompt(isDirty)

  const watchNameFi = watch('nameFi')
  const watchAttachmentFi = watch('attachmentFi')
  const watchAttachmentSv = watch('attachmentSv')
  const watchPublishState = watch('publishState')

  async function submitCertificateData(certificate: CertificateFormType) {
    if (isUpdate && id) {
      return await updateCertificate(Number(id), certificate, newAttachmentFi, newAttachmentSv)
    } else {
      return await createCertificate(certificate, newAttachmentFi!, newAttachmentSv).then((res) => res.id)
    }
  }

  async function submitCertificate(publishState: PublishState) {
    await handleSubmit(
      async (data: CertificateFormType) =>
        await submitFormData(getValues().publishState!, submitCertificateData, data, publishState, {
          returnLocation: contentListPath(exam, ContentType.todistukset)
        })
    )()
  }

  function handleNewAttachmentSelected(newAttachment: AttachmentData[], language?: AttachmentLanguage) {
    const file = newAttachment[0].file

    if (file && language) {
      if (language === 'fi') {
        setNewAttachmentFi(file)
        setValue('attachmentFi', {
          fileName: file.name,
          name: file.name,
          fileKey: ''
        })
      }

      if (language === 'sv') {
        setNewAttachmentSv(file)
        setValue('attachmentSv', {
          fileName: file.name,
          name: file.name,
          fileKey: ''
        })
      }
    }
  }

  function currentAttachment(lang: TeachingLanguage): AttachmentData | undefined {
    if (lang === 'fi') {
      if (newAttachmentFi) {
        return {
          file: newAttachmentFi,
          name: newAttachmentFi.name
        }
      }

      if (watchAttachmentFi) {
        return {
          attachment: {
            name: watchAttachmentFi.fileName,
            fileName: watchAttachmentFi.fileName,
            fileKey: watchAttachmentFi.fileKey,
            fileUploadDate: watchAttachmentFi.fileUploadDate,
            language: watchAttachmentFi.language || 'FI'
          },
          name: watchAttachmentFi.name || ''
        }
      }
    }

    if (lang === 'sv') {
      if (newAttachmentSv) {
        return {
          file: newAttachmentSv,
          name: newAttachmentSv.name
        }
      }

      if (watchAttachmentSv) {
        return {
          attachment: {
            name: watchAttachmentSv.fileName,
            fileName: watchAttachmentSv.fileName,
            fileKey: watchAttachmentSv.fileKey,
            fileUploadDate: watchAttachmentSv.fileUploadDate,
            language: watchAttachmentSv.language || 'FI'
          },
          name: watchAttachmentSv.name || ''
        }
      }
    }
  }

  const handleCancelClick = () => navigate(-1)

  const nameErrorFi = errors.nameFi?.message
  const contentErrorFi = errors.descriptionFi?.message
  const attachmentErrorFi = errors.attachmentFi?.message

  const hasFiError = nameErrorFi || contentErrorFi || attachmentErrorFi

  const nameErrorSv = errors.nameSv?.message
  const contentErrorSv = errors.descriptionSv?.message
  const attachmentErrorSv = errors.attachmentSv?.message

  const hasSvError = nameErrorSv || contentErrorSv || attachmentErrorSv

  return (
    <div className="ludos-form">
      <BlockNavigation shouldBlock={isDirty && !isSubmitting} />
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkotodistus') : watchNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvaustodistus') : t('form.muokkauskuvaus')}
      />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" onSubmit={(e) => e.preventDefault()}>
          {exam === Exam.LD && <FormAineDropdown />}

          <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

          <div className={`${exam === Exam.SUKO && 'hidden'} mb-6`}>
            <LanguageTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fiErrors={!!hasFiError}
              svErrors={!!hasSvError}
            />
          </div>

          <div className={`${activeTab === TeachingLanguage.fi ? '' : 'hidden'}`}>
            <TextInput id="nameFi" register={register} required error={!!nameErrorFi}>
              {t('form.todistuksennimi')}
            </TextInput>
            <FormError error={nameErrorFi} />

            {exam !== Exam.LD && (
              <>
                <TextAreaInput id="descriptionFi" register={register} required error={!!contentErrorFi}>
                  {t('form.todistuksenkuvaus')}
                </TextAreaInput>
                <FormError error={contentErrorFi} />
              </>
            )}

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              contentType={ContentType.todistukset}
              attachmentData={currentAttachment(TeachingLanguage.fi)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language="fi"
            />

            <FormError error={attachmentErrorFi} />
          </div>

          <div className={`${activeTab === TeachingLanguage.sv ? '' : 'hidden'}`}>
            <TextInput id="nameSv" register={register} required error={!!nameErrorSv}>
              {t('form.todistuksennimi')}
            </TextInput>
            <FormError error={nameErrorSv} />

            {exam !== Exam.LD && (
              <>
                <TextAreaInput id="descriptionSv" register={register} required error={!!contentErrorSv}>
                  {t('form.todistuksenkuvaus')}
                </TextAreaInput>
                <FormError error={contentErrorSv} />
              </>
            )}

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              contentType={ContentType.todistukset}
              attachmentData={currentAttachment(TeachingLanguage.sv)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language="sv"
            />

            <FormError error={attachmentErrorSv} />
          </div>
        </form>
      </FormProvider>

      <FormButtonRow
        actions={{
          onSubmitClick: () => submitCertificate(PublishState.Published),
          onSaveDraftClick: () => submitCertificate(PublishState.Draft),
          onDeleteClick: () => setIsDeleteModalOpen(true),
          onCancelClick: handleCancelClick
        }}
        state={{
          isUpdate,
          disableSubmit: isSubmitting,
          publishState: watchPublishState
        }}
        formHasValidationErrors={Object.keys(errors).length > 0}
        submitError={submitError}
      />

      <DeleteModal
        modalTitle={lt.contentDeleteModalTitle[ContentType.todistukset]}
        open={isDeleteModalOpen}
        onDeleteAction={() => submitCertificate(PublishState.Deleted)}
        onClose={() => setIsDeleteModalOpen(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText[ContentType.todistukset](watchNameFi)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}

export default CertificateForm
