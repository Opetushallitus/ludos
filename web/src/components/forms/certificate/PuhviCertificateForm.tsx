import { FormProvider } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCertificateAttachmentHandler } from '../../../hooks/useCertificateAttachmentHandler'
import { useCertificateForm } from '../../../hooks/useCertificateForm'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { ContentFormAction, ContentType, Exam, Language, PublishState } from '../../../types'
import { BlockNavigation } from '../../BlockNavigation'
import { LanguageTabs } from '../../LanguageTabs'
import { DeleteModal } from '../../modal/DeleteModal'
import { TextAreaInput } from '../../TextAreaInput'
import { TextInput } from '../../TextInput'
import { AttachmentSelector } from '../formCommon/attachment/AttachmentSelector'
import { FormButtonRow } from '../formCommon/FormButtonRow'
import { FormHeader } from '../formCommon/FormHeader'
import { PuhviCertificateFormType } from '../schemas/certificateSchema'

export const PuhviCertificateForm = ({
  action,
  defaultValues
}: {
  action: ContentFormAction
  defaultValues: PuhviCertificateFormType
}) => {
  const { t, lt } = useLudosTranslation()
  const navigate = useNavigate()

  const {
    isUpdate,
    submitCertificate,
    submitError,
    methods,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    tab: { activeTab, setActiveTab }
  } = useCertificateForm<PuhviCertificateFormType>(Exam.PUHVI, action, defaultValues)

  const {
    watch,
    setValue,
    register,
    formState: { errors, isDirty, isSubmitting }
  } = methods

  const { newAttachmentFi, newAttachmentSv, currentAttachment, handleNewAttachmentSelected } =
    useCertificateAttachmentHandler(setValue, watch)

  const handleCancelClick = () => navigate(-1)

  const watchNameFi = watch('nameFi')
  const watchPublishState = watch('publishState')
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
          <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

          <LanguageTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fiErrors={!!hasFiError}
            svErrors={!!hasSvError}
          />

          <div className={`${activeTab === Language.FI ? '' : 'hidden'}`}>
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
              name="attachmentFi"
              exam={Exam.PUHVI}
              error={attachmentErrorFi}
              contentType={ContentType.CERTIFICATE}
              attachmentData={currentAttachment(Language.FI)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language={Language.FI}
            />
          </div>

          <div className={`${activeTab === Language.SV ? '' : 'hidden'}`}>
            <TextInput id="nameSv" register={register} required error={nameErrorSv}>
              {t('form.todistuksennimi')}
            </TextInput>

            <TextAreaInput id="descriptionSv" register={register} required error={contentErrorSv}>
              {t('form.todistuksenkuvaus')}
            </TextAreaInput>

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              name="attachmentSv"
              exam={Exam.PUHVI}
              error={attachmentErrorSv}
              contentType={ContentType.CERTIFICATE}
              attachmentData={currentAttachment(Language.SV)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language={Language.SV}
            />
          </div>
        </form>
      </FormProvider>

      <FormButtonRow
        actions={{
          onSubmitClick: () => submitCertificate(PublishState.Published, newAttachmentFi, newAttachmentSv),
          onSaveDraftClick: () => submitCertificate(PublishState.Draft, newAttachmentFi, newAttachmentSv),
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
        onDeleteAction={() => submitCertificate(PublishState.Deleted, newAttachmentFi, newAttachmentSv)}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText.CERTIFICATE(watchNameFi)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}
