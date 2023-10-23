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
  PublishState,
  TeachingLanguage
} from '../../types'
import {
  createInstruction,
  deleteInstructionAttachment,
  fetchData,
  updateInstruction,
  uploadInstructionAttachment
} from '../../request'
import { useContext, useState } from 'react'
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
import { DeleteModal } from '../modal/DeleteModal'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { LudosContext } from '../../contexts/LudosContext'

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
  const navigate = useNavigate()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const { setNotification } = useNotification()

  const [activeTab, setActiveTab] = useState('fi')
  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState<string | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

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
  const watchNameSv = watch('nameSv')
  const watchContentFi = watch('contentFi')
  const watchContentSv = watch('contentSv')
  const watchPublishState = watch('publishState')

  async function submitInstructionData(instruction: InstructionFormType) {
    if (isUpdate && id) {
      const mapWithFileKeyAndName: MapWithFileKeyAndMetadata = new Map()

      const combinedAttachmentData = [...attachmentDataFi, ...attachmentDataSv]

      combinedAttachmentData.forEach(({ attachment, name, language }) => {
        mapWithFileKeyAndName.set(attachment!.fileKey, { name: name, language: language ?? 'fi' })
      })

      return await updateInstruction(Number(id), instruction, mapWithFileKeyAndName)
    } else {
      const findFilesFromAttachmentData = [...attachmentDataFi, ...attachmentDataSv]
        .filter(({ file }) => file !== undefined)
        .map(({ file, name, language }) => ({
          file: file!,
          name,
          language: language ?? 'fi'
        }))

      return await createInstruction(instruction, findFilesFromAttachmentData).then((res) => res.id)
    }
  }

  function setSuccessNotification(newPublishState: PublishState) {
    const currentState = watchPublishState as typeof PublishState.Published | typeof PublishState.Draft

    setNotification({
      message: isUpdate
        ? lt.contentUpdateSuccessNotification[ContentType.ohjeet][currentState][newPublishState]
        : lt.contentCreateSuccessNotification[ContentType.ohjeet][
            newPublishState as typeof PublishState.Published | typeof PublishState.Draft
          ],
      type: NotificationEnum.success
    })
  }

  function handleSuccess(newPublishState: PublishState, resultId: number) {
    setSubmitError('')
    setSuccessNotification(newPublishState)

    if (newPublishState === PublishState.Deleted) {
      return navigate(contentListPath(exam, ContentType.ohjeet), {
        replace: true // so that user cannot back navigate to edit deleted instruction
      })
    }

    navigate(contentPagePath(exam, ContentType.ohjeet, resultId), {
      state: { returnLocation: contentListPath(exam, ContentType.ohjeet) }
    })
  }

  function setErrorNotification(publishState: PublishState) {
    setNotification({
      message:
        publishState === PublishState.Deleted
          ? t('form.notification.ohjeen-poisto.epaonnistui')
          : t('form.notification.ohjeen-tallennus.epaonnistui'),
      type: NotificationEnum.error
    })
  }

  async function submitInstruction(publishState: PublishState) {
    await handleSubmit(async (data: InstructionFormType) => {
      const instruction = { ...data, publishState }

      try {
        setIsLoading(true)
        const resultId = await submitInstructionData(instruction)
        setSubmitError('')
        handleSuccess(publishState, resultId)
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        setErrorNotification(publishState)
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
            label={t('form.ohjeensisalto')}
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

        <div className={`${activeTab === TeachingLanguage.sv ? '' : 'hidden'}`}>
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
            label={t('form.ohjeensisalto')}
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
          onSubmitClick: () => submitInstruction(PublishState.Published),
          onSaveDraftClick: () => submitInstruction(PublishState.Draft),
          onDeleteClick: () => setOpenDeleteModal(true)
        }}
        state={{
          isUpdate,
          isLoading,
          publishState: watchPublishState
        }}
        formHasValidationErrors={Object.keys(errors).length > 0}
        errorMessage={submitError}
      />

      <DeleteModal
        modalTitle={lt.contentDeleteModalTitle[ContentType.ohjeet]}
        open={openDeleteModal}
        onDeleteAction={() => submitInstruction(PublishState.Deleted)}
        onClose={() => setOpenDeleteModal(false)}>
        <div className="h-[15vh] p-6">
          <p>{lt.contentDeleteModalText[ContentType.ohjeet](uiLanguage === 'fi' ? watchNameFi : watchNameSv)}</p>
        </div>
      </DeleteModal>
    </div>
  )
}

export default InstructionForm
