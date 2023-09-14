import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  AttachmentLanguage,
  ContentFormAction,
  ContentTypeEng,
  Exam,
  InstructionIn,
  MapWithFileKeyAndMetadata,
  PublishState
} from '../../../../types'
import { useTranslation } from 'react-i18next'
import {
  createInstruction,
  deleteInstructionAttachment,
  updateInstruction,
  uploadInstructionAttachment
} from '../../../../request'
import { useState } from 'react'
import { Tabs } from '../../../Tabs'
import { InstructionFormType, instructionSchema } from './instructionSchema'
import { TextInput } from '../../../TextInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { AttachmentSelector } from '../../formCommon/attachment/AttachmentSelector'
import { useFetch } from '../../../../hooks/useFetch'
import { useInstructionFormInitializer } from '../../../../hooks/useInstructionFormInitializer'
import { FormError } from '../../formCommon/FormErrors'
import { TipTap } from '../../formCommon/editor/TipTap'

type InstructionFormProps = {
  action: ContentFormAction
}

const InstructionForm = ({ action }: InstructionFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const [activeTab, setActiveTab] = useState('fi')
  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id

  const { data: instruction, loading: instructionLoading } = useFetch<InstructionIn>(
    `instruction/${exam}/${id}`,
    action === ContentFormAction.uusi
  )

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<InstructionFormType>({
    mode: 'onBlur',
    resolver: zodResolver(instructionSchema)
  })

  useInstructionFormInitializer({
    instruction,
    exam,
    reset,
    setValue,
    setAttachmentDataFi,
    setAttachmentDataSv
  })

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: InstructionFormType) => {
      const instructionIn = { ...data, publishState }

      try {
        setLoading(true)
        let resultId: string

        if (action === ContentFormAction.muokkaus && instruction) {
          const mapWithFileKeyAndName: MapWithFileKeyAndMetadata = new Map()

          const combinedAttachmentData = [...attachmentDataFi, ...attachmentDataSv]

          combinedAttachmentData.forEach(({ attachment, name, language }) => {
            mapWithFileKeyAndName.set(attachment!.fileKey, { name: name, language: language ?? 'fi' })
          })

          await updateInstruction(instruction.id, instructionIn, mapWithFileKeyAndName)
          resultId = instruction.id.toString()
        } else {
          const findFilesFromAttachmentData = [...attachmentDataFi, ...attachmentDataSv]
            .filter(({ file }) => file !== undefined)
            .map(({ file, name, language }) => ({
              file: file!,
              name,
              language: language ?? 'fi'
            }))

          const { id } = await createInstruction<{ id: string }>(instructionIn, findFilesFromAttachmentData)
          resultId = id
        }
        setSubmitError('')

        navigate(`/${exam}/instructions/${resultId}`)
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }

  const createPromises = async (attachmentFiles: AttachmentData[], lang: AttachmentLanguage) =>
    attachmentFiles.map(async ({ file, name }) => {
      if (file) {
        try {
          return {
            attachment: await uploadInstructionAttachment(instruction!.id, exam, {
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

    if (action === ContentFormAction.muokkaus) {
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
    if (action === ContentFormAction.muokkaus) {
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
      <FormHeader action={action} contentType={ContentTypeEng.ohjeet} name={instruction?.nameFi} />

      <form
        className="min-h-[50vh] border-y-2 border-gray-light py-5"
        id="newAssignment"
        onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
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
            content={instruction?.contentFi}
            labelKey="form.ohjeensisalto"
            dataTestId="editor-content-fi"
            key={instruction ? 'content-fi' : 'content-fi-new'}
          />

          <div className="mb-3 mt-6">
            <TextInput id="shortDescriptionFi" register={register}>
              {t('form.lyhyt-kuvaus')}
            </TextInput>
          </div>

          <label className="font-semibold">{t('form.tiedostot')}</label>
          <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
          <AttachmentSelector
            contentType={ContentTypeEng.ohjeet}
            language="fi"
            attachmentData={attachmentDataFi.filter(({ language }) => language === 'fi')}
            handleNewAttachmentSelected={handleNewAttachmentSelected}
            handleNewAttachmentName={handleAttachmentNameChange}
            deleteFileByIndex={deleteFileByIndex}
            loading={instructionLoading}
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
            content={instruction?.contentSv}
            labelKey="form.ohjeensisalto"
            dataTestId="editor-content-sv"
            key={instruction ? 'content-sv' : 'content-sv-new'}
          />

          <div className="mb-3 mt-6">
            <TextInput id="shortDescriptionSv" register={register}>
              {t('form.lyhyt-kuvaus')}
            </TextInput>
          </div>

          <label className="font-semibold">{t('form.tiedostot')}</label>
          <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
          <AttachmentSelector
            contentType={ContentTypeEng.ohjeet}
            language="sv"
            attachmentData={attachmentDataSv}
            handleNewAttachmentSelected={handleNewAttachmentSelected}
            handleNewAttachmentName={handleAttachmentNameChange}
            deleteFileByIndex={deleteFileByIndex}
            loading={instructionLoading}
          />
        </div>

        {fileUploadErrorMessage && (
          <p className="ml-2 text-red-primary" data-testid="file-upload-error-message">
            {fileUploadErrorMessage}
          </p>
        )}
      </form>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
        errorMessage={submitError}
        isLoading={loading}
      />
    </div>
  )
}

export default InstructionForm
