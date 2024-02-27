import { FormProvider } from 'react-hook-form'
import { SukoCertificateFormType } from '../schemas/certificateSchema'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { useNavigate } from 'react-router-dom'
import { ContentFormAction, ContentType, Exam, Language, PublishState } from '../../../types'
import { BlockNavigation } from '../../BlockNavigation'
import { FormHeader } from '../formCommon/FormHeader'
import { TextInput } from '../../TextInput'
import { TextAreaInput } from '../../TextAreaInput'
import { AttachmentSelector } from '../formCommon/attachment/AttachmentSelector'
import { FormButtonRow } from '../formCommon/FormButtonRow'
import { DeleteModal } from '../../modal/DeleteModal'
import { useCertificateForm } from '../../../hooks/useCertificateForm'
import { useCertificateAttachmentHandler } from '../../../hooks/useCertificateAttachmentHandler'

export const SukoCertificateForm = ({
  action,
  defaultValues
}: {
  action: ContentFormAction
  defaultValues: SukoCertificateFormType
}) => {
  const { t, lt } = useLudosTranslation()
  const navigate = useNavigate()

  const { isUpdate, submitCertificate, submitError, methods, isDeleteModalOpen, setIsDeleteModalOpen } =
    useCertificateForm<SukoCertificateFormType>(Exam.SUKO, action, defaultValues)

  const {
    watch,
    register,
    setValue,
    formState: { errors, isDirty, isSubmitting }
  } = methods

  const { newAttachmentFi, currentAttachment, handleNewAttachmentSelected } = useCertificateAttachmentHandler(
    setValue,
    watch
  )

  const watchNameFi = watch('nameFi')
  const watchPublishState = watch('publishState')

  const handleCancelClick = () => navigate(-1)

  const nameErrorFi = errors.nameFi?.message
  const contentErrorFi = errors.descriptionFi?.message
  const attachmentErrorFi = errors.attachmentFi?.message

  return (
    <div className="ludos-form">
      <BlockNavigation shouldBlock={isDirty && !isSubmitting} />
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkotodistus') : watchNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvaustodistus') : t('form.muokkauskuvaus')}
      />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

          <div>
            <TextInput id="nameFi" register={register} required error={nameErrorFi}>
              {t('form.todistuksennimi')}
            </TextInput>

            <TextAreaInput id="descriptionFi" register={register} required error={contentErrorFi}>
              {t('form.todistuksenkuvaus')}
            </TextAreaInput>

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              error={attachmentErrorFi}
              name="attachmentFi"
              contentType={ContentType.CERTIFICATE}
              attachmentData={currentAttachment(Language.FI)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language={Language.FI}
            />
          </div>
        </form>
      </FormProvider>

      <FormButtonRow
        actions={{
          onSubmitClick: () => submitCertificate(PublishState.Published, newAttachmentFi, null),
          onSaveDraftClick: () => submitCertificate(PublishState.Draft, newAttachmentFi, null),
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
        modalTitle={lt.contentDeleteModalTitle.CERTIFICATE}
        open={isDeleteModalOpen}
        onDeleteAction={() => submitCertificate(PublishState.Deleted, newAttachmentFi, null)}
        onClose={() => setIsDeleteModalOpen(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText.CERTIFICATE(watchNameFi)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}
