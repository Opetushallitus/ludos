import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { LudosContext } from '../../contexts/LudosContext'
import { useBlockFormCloseOrRefresh } from '../../hooks/useBlockFormCloseOrRefresh'
import { useFormSubmission } from '../../hooks/useFormSubmission'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { createInstruction, createNewVersionOfInstruction, fetchDataOrReload } from '../../request'
import {
  AttachmentData,
  AttachmentDtoOut,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEn,
  Exam,
  InstructionDtoOut,
  Language,
  PublishState
} from '../../types'
import { BlockNavigation } from '../BlockNavigation'
import { InfoBox } from '../InfoBox'
import { LanguageTabs } from '../LanguageTabs'
import { DeleteModal } from '../modal/DeleteModal'
import { TextInput } from '../TextInput'
import { AttachmentSelector } from './formCommon/attachment/AttachmentSelector'
import { TipTap } from './formCommon/editor/TipTap'
import { FormAineDropdown } from './formCommon/FormAineDropdown'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { FormError } from './formCommon/FormErrors'
import { FormHeader } from './formCommon/FormHeader'
import { InstructionFormType, instructionDefaultValues, instructionSchema } from './schemas/instructionSchema'

type InstructionFormProps = {
  action: ContentFormAction
}

function mapInstructionInAttachmentDataWithLanguage(
  attachmentIn: AttachmentDtoOut[],
  lang: Language
): AttachmentData[] {
  const attachmentData = attachmentIn.map((attachment) => ({
    attachment,
    name: attachment?.name ?? '',
    language: attachment.language
  }))

  return attachmentData.filter((it) => it.language === lang)
}

const InstructionForm = ({ action }: InstructionFormProps) => {
  const { t, lt } = useLudosTranslation()
  const { uiLanguage } = useContext(LudosContext)
  const { state } = useLocation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi
      ? `/:exam/:contentTypePluralFi/${action}`
      : `/:exam/:contentTypePluralFi/${action}/:id`
  const match = useMatch(matchUrl)
  const [activeTab, setActiveTab] = useState<Language>(Language.FI)

  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [defaultValueError, setDefaultValueError] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const { submitFormData, submitError } = useFormSubmission(exam, ContentType.INSTRUCTION, isUpdate)

  const methods = useForm<InstructionFormType>({
    defaultValues:
      isUpdate && id
        ? async () => {
            try {
              const instruction = await fetchDataOrReload<InstructionDtoOut>(
                `${ContentTypeSingularEn.INSTRUCTION}/${exam}/${id}`
              )
              const attachmentDataFi = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'FI')
              const attachmentDataSv = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'SV')

              setAttachmentDataFi(attachmentDataFi)
              setAttachmentDataSv(attachmentDataSv)
              setIsLoaded(true)
              return instruction
            } catch (e) {
              setDefaultValueError(true)
              return { exam, ...instructionDefaultValues } as InstructionFormType
            }
          }
        : async () => ({ exam, ...instructionDefaultValues }) as InstructionFormType,
    mode: 'onBlur',
    resolver: zodResolver(instructionSchema)
  })

  const {
    getValues,
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting }
  } = methods

  useBlockFormCloseOrRefresh(isDirty)

  const watchNameFi = watch('nameFi')
  const watchNameSv = watch('nameSv')
  const watchContentFi = watch('contentFi')
  const watchContentSv = watch('contentSv')
  const watchPublishState = watch('publishState')

  async function submitInstructionData(instruction: InstructionFormType): Promise<number> {
    const combinedAttachmentData = [...attachmentDataFi, ...attachmentDataSv]

    if (isUpdate) {
      const toUpdate: AttachmentData[] = combinedAttachmentData
        .filter(({ attachment }) => attachment !== undefined)
        .map(({ attachment, name, language }) => ({
          attachment,
          name,
          language: language ?? 'FI'
        }))

      const toUpload: AttachmentData[] = combinedAttachmentData
        .filter(({ file }) => file !== undefined)
        .map(({ file, name, language }) => ({
          file,
          name,
          language: language ?? 'FI'
        }))

      await createNewVersionOfInstruction<number>(Number(id), instruction, toUpdate, toUpload)
      return Number(id)
    } else {
      const findFilesFromAttachmentData: AttachmentData[] = combinedAttachmentData
        .filter(({ file }) => file !== undefined)
        .map(({ file, name, language }) => ({
          file: file!,
          name,
          language: language ?? 'FI'
        }))

      return await createInstruction<{ id: number }>(instruction, findFilesFromAttachmentData).then((res) => res.id)
    }
  }

  async function submitInstruction(newPublishState: PublishState) {
    await handleSubmit(
      async (data: InstructionFormType) =>
        await submitFormData(getValues().publishState!, submitInstructionData, data, newPublishState, state)
    )()
  }

  const attachLanguageToFiles = (attachmentFiles: AttachmentData[], language: Language): AttachmentData[] =>
    attachmentFiles.map((attachment) => ({
      ...attachment,
      language: language ?? 'FI'
    }))

  const handleNewAttachmentSelected = async (attachmentFiles: AttachmentData[], language?: Language) => {
    const dataToSet = attachLanguageToFiles(attachmentFiles, language ?? 'FI')

    if (language === 'SV') {
      setAttachmentDataSv((prev) => [...prev, ...dataToSet])
    } else if (language === 'FI') {
      setAttachmentDataFi((prev) => [...prev, ...dataToSet])
    }
  }

  const deleteFileByIndex = (index: number, language: Language) => {
    if (language === 'FI') {
      setAttachmentDataFi(attachmentDataFi.filter((_, i) => i !== index))
    } else {
      setAttachmentDataSv(attachmentDataSv.filter((_, i) => i !== index))
    }
  }

  const handleAttachmentNameChange = (newName: string, index: number, language: Language) => {
    const isSv = language === 'SV'

    const attachmentDataCopy = isSv ? [...attachmentDataSv] : [...attachmentDataFi]

    attachmentDataCopy[index].name = newName
    isSv ? setAttachmentDataSv(attachmentDataCopy) : setAttachmentDataFi(attachmentDataCopy)
  }

  const instructionNameError = errors.nameRequired?.message as string
  const nameFiError = errors.nameFi?.message as string
  const contentFiError = errors.contentFi?.message as string
  const nameSvError = errors.nameSv?.message as string
  const contentSvError = errors.contentSv?.message as string

  const hasFiError = nameFiError || contentFiError || instructionNameError
  const hasSvError = nameSvError || contentSvError || instructionNameError

  const handleContentChange = (newContent: string) => {
    if (activeTab === 'FI') {
      setValue('contentFi', newContent, { shouldDirty: true })
    } else if (activeTab === 'SV') {
      setValue('contentSv', newContent, { shouldDirty: true })
    }
  }

  const handleCancelClick = () => navigate(-1)

  if (defaultValueError) {
    return <InfoBox type="error" i18nKey={t('error.sisallon-lataaminen-epaonnistui')} />
  }

  return (
    <div className="ludos-form">
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkoohje') : watchNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvausohje') : t('form.muokkauskuvaus')}
      />
      <BlockNavigation shouldBlock={isDirty && !isSubmitting} />
      <FormProvider {...methods}>
        <form className="min-h-[50vh] border-y-2 border-gray-light py-5" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          {exam === Exam.LD && <FormAineDropdown />}

          <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

          <div className="mb-6">
            <LanguageTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              fiErrors={!!hasFiError}
              svErrors={!!hasSvError}
            />
          </div>

          <div className={`${activeTab === Language.FI ? '' : 'hidden'}`}>
            <TextInput
              id="nameFi"
              register={register}
              deps={['nameRequired']}
              error={nameFiError || instructionNameError}
              required
            >
              {t('form.ohjeennimi')}
            </TextInput>

            <TipTap
              onContentChange={handleContentChange}
              content={watchContentFi}
              label={t('form.ohjeensisalto')}
              dataTestId="editor-content-fi"
              key={`content-fi-${isLoaded ? 'loaded' : 'not-loaded'}`}
              fieldError={!!contentFiError}
            />

            <FormError error={contentFiError} name="contentFi" />

            {exam !== Exam.LD && (
              <div className="mb-3 mt-6">
                <TextInput id="shortDescriptionFi" register={register}>
                  {t('form.lyhyt-kuvaus')}
                </TextInput>
              </div>
            )}

            <label className="font-semibold">{t('form.tiedostot')}</label>
            <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
            <AttachmentSelector
              name="attachmentFi"
              exam={exam}
              contentType={ContentType.INSTRUCTION}
              language={Language.FI}
              attachmentData={attachmentDataFi.filter(({ language }) => language === Language.FI)}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              handleNewAttachmentName={handleAttachmentNameChange}
              deleteFileByIndex={deleteFileByIndex}
            />
          </div>

          <div className={`${activeTab === Language.SV ? '' : 'hidden'}`}>
            <TextInput
              id="nameSv"
              register={register}
              deps={['nameRequired']}
              error={nameSvError || instructionNameError}
              required
            >
              {t('form.ohjeennimi')}
            </TextInput>

            <TipTap
              onContentChange={handleContentChange}
              content={watchContentSv}
              label={t('form.ohjeensisalto')}
              dataTestId="editor-content-sv"
              key={`content-sv-${isLoaded ? 'loaded' : 'not-loaded'}`}
              fieldError={!!contentSvError}
            />

            <FormError error={contentSvError} name="contentSv" />

            {exam !== Exam.LD && (
              <div className="mb-3 mt-6">
                <TextInput id="shortDescriptionSv" register={register}>
                  {t('form.lyhyt-kuvaus')}
                </TextInput>
              </div>
            )}

            <label className="font-semibold">{t('form.tiedostot')}</label>
            <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
            <AttachmentSelector
              name="attachmentSv"
              exam={exam}
              contentType={ContentType.INSTRUCTION}
              language={Language.SV}
              attachmentData={attachmentDataSv}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              handleNewAttachmentName={handleAttachmentNameChange}
              deleteFileByIndex={deleteFileByIndex}
            />
          </div>
        </form>
      </FormProvider>

      <FormButtonRow
        actions={{
          onSubmitClick: () => submitInstruction(PublishState.Published),
          onSaveDraftClick: () => submitInstruction(PublishState.Draft),
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
        modalTitle={lt.contentDeleteModalTitle.INSTRUCTION}
        open={isDeleteModalOpen}
        onDeleteAction={() => submitInstruction(PublishState.Deleted)}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText.INSTRUCTION(uiLanguage === Language.FI ? watchNameFi : watchNameSv)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}

export default InstructionForm
