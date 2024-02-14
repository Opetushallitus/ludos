import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  AttachmentDtoOut,
  AttachmentLanguage,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  InstructionDtoOut,
  PublishState,
  TeachingLanguage
} from '../../types'
import { createInstruction, createNewVersionInstruction, fetchDataOrReload } from '../../request'
import { useContext, useState } from 'react'
import { LanguageTabs } from '../LanguageTabs'
import { instructionDefaultValues, InstructionFormType, instructionSchema } from './schemas/instructionSchema'
import { TextInput } from '../TextInput'
import { FormHeader } from './formCommon/FormHeader'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { AttachmentSelector } from './formCommon/attachment/AttachmentSelector'
import { FormError } from './formCommon/FormErrors'
import { TipTap } from './formCommon/editor/TipTap'
import { DeleteModal } from '../modal/DeleteModal'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { LudosContext } from '../../contexts/LudosContext'
import { FormAineDropdown } from './formCommon/FormAineDropdown'
import { BlockNavigation } from '../BlockNavigation'
import { useBlockFormCloseOrRefresh } from '../../hooks/useBlockFormCloseOrRefresh'
import { useFormSubmission } from '../../hooks/useFormSubmission'
import { InfoBox } from '../InfoBox'

type InstructionFormProps = {
  action: ContentFormAction
}

const convertToLowerCase = (language: 'FI' | 'SV') => language.toLowerCase() as AttachmentLanguage

function mapInstructionInAttachmentDataWithLanguage(
  attachmentIn: AttachmentDtoOut[],
  lang: AttachmentLanguage
): AttachmentData[] {
  const attachmentData = attachmentIn.map((attachment) => ({
    attachment,
    name: attachment?.name ?? '',
    language: convertToLowerCase(attachment.language)
  }))

  return attachmentData.filter((it) => it.language === lang)
}

const InstructionForm = ({ action }: InstructionFormProps) => {
  const { t, lt } = useLudosTranslation()
  const { uiLanguage } = useContext(LudosContext)
  const { state } = useLocation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const [activeTab, setActiveTab] = useState<TeachingLanguage>('fi')

  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [defaultValueError, setDefaultValueError] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const { submitFormData, submitError } = useFormSubmission(exam, ContentType.ohjeet, isUpdate)

  const methods = useForm<InstructionFormType>({
    defaultValues:
      isUpdate && id
        ? async () => {
            try {
              const instruction = await fetchDataOrReload<InstructionDtoOut>(
                `${ContentTypeSingularEng.ohjeet}/${exam}/${id}`
              )
              const attachmentDataFi = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'fi')
              const attachmentDataSv = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'sv')

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
          language: language ?? 'fi'
        }))

      const toUpload: AttachmentData[] = combinedAttachmentData
        .filter(({ file }) => file !== undefined)
        .map(({ file, name, language }) => ({
          file,
          name,
          language: language ?? 'fi'
        }))

      return await createNewVersionInstruction<number>(Number(id), instruction, toUpdate, toUpload)
    } else {
      const findFilesFromAttachmentData: AttachmentData[] = combinedAttachmentData
        .filter(({ file }) => file !== undefined)
        .map(({ file, name, language }) => ({
          file: file!,
          name,
          language: language ?? 'fi'
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

  const attachLanguageToFiles = (attachmentFiles: AttachmentData[], language: AttachmentLanguage): AttachmentData[] =>
    attachmentFiles.map((attachment) => ({
      ...attachment,
      language: language ?? 'fi'
    }))

  const handleNewAttachmentSelected = async (attachmentFiles: AttachmentData[], language?: AttachmentLanguage) => {
    const dataToSet = attachLanguageToFiles(attachmentFiles, language ?? 'fi')

    if (language === 'sv') {
      setAttachmentDataSv((prev) => [...prev, ...dataToSet])
    } else if (language === 'fi') {
      setAttachmentDataFi((prev) => [...prev, ...dataToSet])
    }
  }

  const deleteFileByIndex = (index: number, language: AttachmentLanguage) => {
    if (language === 'fi') {
      setAttachmentDataFi(attachmentDataFi.filter((_, i) => i !== index))
    } else {
      setAttachmentDataSv(attachmentDataSv.filter((_, i) => i !== index))
    }
  }

  const handleAttachmentNameChange = (newName: string, index: number, language: AttachmentLanguage) => {
    const isSv = language === 'sv'

    const updatedAttachmentData = isSv ? [...attachmentDataSv] : [...attachmentDataFi]
    updatedAttachmentData[index].name = newName
    isSv ? setAttachmentDataSv(updatedAttachmentData) : setAttachmentDataFi(updatedAttachmentData)
  }

  const instructionNameError = errors.nameRequired?.message as string
  const nameFiError = errors.nameFi?.message as string
  const contentFiError = errors.contentFi?.message as string
  const nameSvError = errors.nameSv?.message as string
  const contentSvError = errors.contentSv?.message as string

  const hasFiError = nameFiError || contentFiError || instructionNameError
  const hasSvError = nameSvError || contentSvError || instructionNameError

  const handleContentChange = (newContent: string) => {
    if (activeTab === 'fi') {
      setValue('contentFi', newContent, { shouldDirty: true })
    } else if (activeTab === 'sv') {
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

          <div className={`${activeTab === TeachingLanguage.fi ? '' : 'hidden'}`}>
            <TextInput
              id="nameFi"
              register={register}
              deps={['nameRequired']}
              error={nameFiError || instructionNameError}
              required>
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
              contentType={ContentType.ohjeet}
              language="fi"
              attachmentData={attachmentDataFi.filter(({ language }) => language === 'fi')}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              handleNewAttachmentName={handleAttachmentNameChange}
              deleteFileByIndex={deleteFileByIndex}
            />
          </div>

          <div className={`${activeTab === TeachingLanguage.sv ? '' : 'hidden'}`}>
            <TextInput
              id="nameSv"
              register={register}
              deps={['nameRequired']}
              error={nameSvError || instructionNameError}
              required>
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
              contentType={ContentType.ohjeet}
              language="sv"
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
        modalTitle={lt.contentDeleteModalTitle[ContentType.ohjeet]}
        open={isDeleteModalOpen}
        onDeleteAction={() => submitInstruction(PublishState.Deleted)}
        onClose={() => setIsDeleteModalOpen(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText[ContentType.ohjeet](uiLanguage === 'fi' ? watchNameFi : watchNameSv)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}

export default InstructionForm
