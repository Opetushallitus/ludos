import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { useNavigate } from 'react-router-dom'
import { ContentFormAction, ContentType, Exam, Language, PublishState } from '../../../types'
import { LdCertificateFormType } from '../schemas/certificateSchema'
import { FormProvider } from 'react-hook-form'
import { BlockNavigation } from '../../BlockNavigation'
import { FormHeader } from '../formCommon/FormHeader'
import { FormAineDropdown } from '../formCommon/FormAineDropdown'
import { LanguageTabs } from '../../LanguageTabs'
import { TextInput } from '../../TextInput'
import { AttachmentSelector } from '../formCommon/attachment/AttachmentSelector'
import { FormButtonRow } from '../formCommon/FormButtonRow'
import { DeleteModal } from '../../modal/DeleteModal'
import { useCertificateForm } from '../../../hooks/useCertificateForm'
import { useCertificateAttachmentHandler } from '../../../hooks/useCertificateAttachmentHandler'

export const LdCertificateForm = ({
  action,
  defaultValues
}: {
  action: ContentFormAction
  defaultValues: LdCertificateFormType
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
  } = useCertificateForm<LdCertificateFormType>(Exam.LD, action, defaultValues)

  const {
    watch,
    setValue,
    register,
    formState: { errors, isDirty, isSubmitting }
  } = methods

  const { newAttachmentFi, newAttachmentSv, currentAttachment, handleNewAttachmentSelected } =
    useCertificateAttachmentHandler(setValue, watch)

  const watchNameFi = watch('nameFi')
  const watchPublishState = watch('publishState')

  const handleCancelClick = () => navigate(-1)

  const nameErrorFi = errors.nameFi?.message
  const attachmentErrorFi = errors.attachmentFi?.message

  const hasFiError = nameErrorFi || attachmentErrorFi

  const nameErrorSv = errors.nameSv?.message
  const attachmentErrorSv = errors.attachmentSv?.message

  const hasSvError = nameErrorSv || attachmentErrorSv

  return (
    <div className="ludos-form">
      <BlockNavigation shouldBlock={isDirty && !isSubmitting} />
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkotodistus') : watchNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvaustodistus') : t('form.muokkauskuvaus')}
      />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" onSubmit={(e) => e.preventDefault()}>
          <FormAineDropdown />

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

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              name="attachmentFi"
              contentType={ContentType.CERTIFICATE}
              attachmentData={currentAttachment(Language.FI)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              language={Language.FI}
              error={attachmentErrorFi}
            />
          </div>

          <div className={`${activeTab === Language.SV ? '' : 'hidden'}`}>
            <TextInput id="nameSv" register={register} required error={nameErrorSv}>
              {t('form.todistuksennimi')}
            </TextInput>

            <div className="mb-2 mt-6 font-semibold">
              {t('form.todistus')}
              <span className="ml-1 text-green-primary">*</span>
            </div>
            <p>{t('form.todistus-ala-otsikko-kuvaus')}</p>

            <AttachmentSelector
              error={attachmentErrorSv}
              name="attachmentSv"
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
        onClose={() => setIsDeleteModalOpen(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText.CERTIFICATE(watchNameFi)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}
