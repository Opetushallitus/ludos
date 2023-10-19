import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  AttachmentDtoOut,
  AttachmentLanguage,
  ContentFormAction,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  InstructionDtoOut,
  MapWithFileKeyAndMetadata,
  PublishState
} from '../../types'
import { useTranslation } from 'react-i18next'
import {
  createInstruction,
  deleteInstructionAttachment,
  fetchData,
  updateInstruction,
  uploadInstructionAttachment
} from '../../request'
import { useState } from 'react'
import { LanguageTabs } from '../LanguageTabs'
import { InstructionFormType, instructionSchema } from './schemas/instructionSchema'
import { TextInput } from '../TextInput'
import { FormHeader } from './formCommon/FormHeader'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { AttachmentSelector } from './formCommon/attachment/AttachmentSelector'
import { FormError } from './formCommon/FormErrors'
import { TipTap } from './formCommon/editor/TipTap'
import { NotificationEnum, useNotification } from '../../contexts/NotificationContext'
import { contentListPath, contentPagePath } from '../LudosRoutes'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const { setNotification } = useNotification()

  const [activeTab, setActiveTab] = useState('fi')
  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<InstructionFormType>({
    defaultValues: isUpdate
      ? async (): Promise<InstructionFormType> => {
          const instruction = await fetchData<InstructionDtoOut>(`${ContentTypeSingularEng.ohjeet}/${exam}/${id}`)
          const attachmentDataFi = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'fi')
          const attachmentDataSv = mapInstructionInAttachmentDataWithLanguage(instruction.attachments, 'sv')

          setAttachmentDataFi(attachmentDataFi)
          setAttachmentDataSv(attachmentDataSv)
          return instruction
        }
      : { exam },
    mode: 'onBlur',
    resolver: zodResolver(instructionSchema)
  })

  const watchNameFi = watch('nameFi')
  const watchContentFi = watch('contentFi')
  const watchContentSv = watch('contentSv')
  const watchPublishState = watch('publishState')

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: InstructionFormType) => {
      const instructionIn = { ...data, publishState }

      try {
        setIsLoading(true)
        let resultId: number

        if (isUpdate && id) {
          const mapWithFileKeyAndName: MapWithFileKeyAndMetadata = new Map()

          const combinedAttachmentData = [...attachmentDataFi, ...attachmentDataSv]

          combinedAttachmentData.forEach(({ attachment, name, language }) => {
            mapWithFileKeyAndName.set(attachment!.fileKey, { name: name, language: language ?? 'fi' })
          })

          resultId = await updateInstruction(Number(id), instructionIn, mapWithFileKeyAndName)
        } else {
          const findFilesFromAttachmentData = [...attachmentDataFi, ...attachmentDataSv]
            .filter(({ file }) => file !== undefined)
            .map(({ file, name, language }) => ({
              file: file!,
              name,
              language: language ?? 'fi'
            }))

          const { id } = await createInstruction(instructionIn, findFilesFromAttachmentData)
          resultId = id
        }

        setSubmitError('')

        if (publishState === PublishState.Draft) {
          setNotification({
            message: isUpdate
              ? t('form.notification.ohjeen-tallennus.palautettu-luonnostilaan')
              : t('form.notification.ohjeen-tallennus.luonnos-onnistui'),
            type: NotificationEnum.success
          })
        }

        if (publishState === PublishState.Published) {
          setNotification({
            message: isUpdate
              ? t('form.notification.ohjeen-tallennus.onnistui')
              : t('form.notification.ohjeen-tallennus.julkaisu-onnistui'),
            type: NotificationEnum.success
          })
        }

        navigate(contentPagePath(exam, ContentType.ohjeet, resultId), {
          state: { returnLocation: contentListPath(exam, ContentType.ohjeet) }
        })
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        setNotification({
          message: t('form.notification.ohjeen-tallennus.epaonnistui'),
          type: NotificationEnum.error
        })
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const createPromises = async (attachmentFiles: AttachmentData[], lang: AttachmentLanguage) =>
    attachmentFiles.map(async ({ file, name }) => {
      if (file) {
        try {
          return {
            attachment: await uploadInstructionAttachment(Number(id), exam, {
              file,
              name,
              lang
            }),
            name
          }
        } catch (error) {
          throw new Error('Failed to upload attachment')
        }
      }
      return null
    })

  const attachLanguageToFiles = (attachmentFiles: AttachmentData[], language: AttachmentLanguage): AttachmentData[] =>
    attachmentFiles.map((attachment) => ({
      ...attachment,
      language: language ?? 'fi'
    }))

  const uploadNewAttachments = async (attachmentFiles: AttachmentData[], language: AttachmentLanguage | undefined) => {
    const uploadResults = await Promise.allSettled(await createPromises(attachmentFiles, language ?? 'fi'))

    const updatedAttachmentData: AttachmentData[] = []

    uploadResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        updatedAttachmentData.push({
          attachment: result.value.attachment,
          name: result.value.name ?? '',
          language: language ?? 'fi'
        })
      } else if (result.status === 'rejected') {
        setFileUploadErrorMessage(t('form.tiedoston-lataus-epaonnistui', { nimi: attachmentFiles[i].name }))
      }
    })

    return updatedAttachmentData
  }

  const handleNewAttachmentSelected = async (attachmentFiles: AttachmentData[], language?: AttachmentLanguage) => {
    setFileUploadErrorMessage(null)
    let dataToSet: AttachmentData[]

    if (isUpdate) {
      dataToSet = await uploadNewAttachments(attachmentFiles, language)
    } else {
      dataToSet = attachLanguageToFiles(attachmentFiles, language ?? 'fi')
    }

    if (language === 'sv') {
      setAttachmentDataSv((prev) => [...prev, ...dataToSet])
    } else if (language === 'fi') {
      setAttachmentDataFi((prev) => [...prev, ...dataToSet])
    }
  }

  const deleteFileByIndex = (index: number, language: AttachmentLanguage) => {
    if (isUpdate) {
      const fileToDelete = language === 'sv' ? attachmentDataSv[index].attachment : attachmentDataFi[index].attachment

      if (fileToDelete) {
        deleteInstructionAttachment(fileToDelete.fileKey)
      }
    }

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
  const nameSvError = errors.nameSv?.message as string

  const handleContentChange = (newContent: string) => {
    if (activeTab === 'fi') {
      setValue('contentFi', newContent)
    } else if (activeTab === 'sv') {
      setValue('contentSv', newContent)
    }
  }

  return (
    <div className="ludos-form">
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkoohje') : watchNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvausohje') : t('form.muokkauskuvaus')}
      />

      <form
        className="min-h-[50vh] border-y-2 border-gray-light py-5"
        id="newAssignment"
        onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <div className="mb-6">
          <LanguageTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className={`${activeTab === 'fi' ? '' : 'hidden'}`}>
          <TextInput
            id="nameFi"
            register={register}
            deps={['nameRequired']}
            error={!!nameFiError || !!instructionNameError}
            required>
            {t('form.ohjeennimi')}
          </TextInput>
          <FormError error={nameFiError || instructionNameError} />

          <TipTap
            onContentChange={handleContentChange}
            content={watchContentFi}
            labelKey="form.ohjeensisalto"
            dataTestId="editor-content-fi"
            key={id ? 'content-fi' : 'content-fi-new'}
          />

          <div className="mb-3 mt-6">
            <TextInput id="shortDescriptionFi" register={register}>
              {t('form.lyhyt-kuvaus')}
            </TextInput>
          </div>

          <label className="font-semibold">{t('form.tiedostot')}</label>
          <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
          <AttachmentSelector
            contentType={ContentType.ohjeet}
            language="fi"
            attachmentData={attachmentDataFi.filter(({ language }) => language === 'fi')}
            handleNewAttachmentSelected={handleNewAttachmentSelected}
            handleNewAttachmentName={handleAttachmentNameChange}
            deleteFileByIndex={deleteFileByIndex}
          />
        </div>

        <div className={`${activeTab === 'sv' ? '' : 'hidden'}`}>
          <TextInput
            id="nameSv"
            register={register}
            deps={['nameRequired']}
            error={!!nameSvError || !!instructionNameError}
            required>
            {t('form.ohjeennimi')}
          </TextInput>
          <FormError error={nameSvError || instructionNameError} />

          <TipTap
            onContentChange={handleContentChange}
            content={watchContentSv}
            labelKey="form.ohjeensisalto"
            dataTestId="editor-content-sv"
            key={id ? 'content-sv' : 'content-sv-new'}
          />

          <div className="mb-3 mt-6">
            <TextInput id="shortDescriptionSv" register={register}>
              {t('form.lyhyt-kuvaus')}
            </TextInput>
          </div>

          <label className="font-semibold">{t('form.tiedostot')}</label>
          <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
          <AttachmentSelector
            contentType={ContentType.ohjeet}
            language="sv"
            attachmentData={attachmentDataSv}
            handleNewAttachmentSelected={handleNewAttachmentSelected}
            handleNewAttachmentName={handleAttachmentNameChange}
            deleteFileByIndex={deleteFileByIndex}
          />
        </div>

        {fileUploadErrorMessage && (
          <p className="ml-2 text-red-primary" data-testid="file-upload-error-message">
            {fileUploadErrorMessage}
          </p>
        )}
      </form>

      <FormButtonRow
        actions={{
          onSubmitClick: () => submitAssignment({ publishState: PublishState.Published }),
          onSaveDraftClick: () => submitAssignment({ publishState: PublishState.Draft })
        }}
        state={{
          isUpdate,
          isLoading,
          publishState: watchPublishState
        }}
        contentType={ContentType.ohjeet}
        formHasValidationErrors={Object.keys(errors).length > 0}
        errorMessage={submitError}
      />
    </div>
  )
}

export default InstructionForm
