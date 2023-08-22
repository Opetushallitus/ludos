import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMatch, useNavigate } from 'react-router-dom'
import {
  AttachmentData,
  AttachmentLanguage,
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
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { AttachmentSelector } from '../../formCommon/attachment/AttachmentSelector'
import { useFetch } from '../../../../hooks/useFetch'
import { useInstructionFormInitializer } from '../../../../hooks/useInstructionFormInitializer'

type InstructionFormProps = {
  action: 'new' | 'update'
}

export const InstructionForm = ({ action }: InstructionFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const matchUrl = action === 'new' ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const [activeTab, setActiveTab] = useState('fi')
  const [attachmentDataFi, setAttachmentDataFi] = useState<AttachmentData[]>([])
  const [attachmentDataSv, setAttachmentDataSv] = useState<AttachmentData[]>([])
  const [fileUploadErrorMessage, setFileUploadErrorMessage] = useState<string | null>(null)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id

  const { data: instruction, loading } = useFetch<InstructionIn>(`instruction/${exam}/${id}`, action === 'new')

  const { register, reset, handleSubmit, setValue } = useForm<InstructionFormType>({
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
        let resultId: string

        if (action === 'update' && instruction) {
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

        navigate(`/${exam}/instructions/${resultId}`)
      } catch (e) {
        console.error(e)
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

    if (action === 'update') {
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
    if (action === 'update') {
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

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={ContentTypeEng.OHJEET} name={instruction?.nameFi} />

      <form
        className="min-h-[50vh] border-y-2 border-gray-light py-5"
        id="newAssignment"
        onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'fi' && (
          <>
            <TextInput id="nameFi" register={register}>
              {t('form.ohjeennimi')}
            </TextInput>
            <TextAreaInput id="contentFi" register={register}>
              {t('form.ohjeensisalto')}
            </TextAreaInput>
            <div className="mb-3 mt-6">
              <TextInput id="shortDescriptionFi" register={register}>
                {t('form.lyhyt-kuvaus')}
              </TextInput>
            </div>

            <label className="font-semibold">{t('form.tiedostot')}</label>
            <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
            <AttachmentSelector
              contentType={ContentTypeEng.OHJEET}
              language="fi"
              attachmentData={attachmentDataFi.filter(({ language }) => language === 'fi')}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              handleNewAttachmentName={handleAttachmentNameChange}
              deleteFileByIndex={deleteFileByIndex}
              loading={loading}
            />
          </>
        )}
        {activeTab === 'sv' && (
          <>
            <TextInput id="nameSv" register={register}>
              {t('form.ohjeennimi')}
            </TextInput>
            <TextAreaInput id="contentSv" register={register}>
              {t('form.ohjeensisalto')}
            </TextAreaInput>
            <div className="mb-3 mt-6">
              <TextInput id="shortDescriptionSv" register={register}>
                {t('form.lyhyt-kuvaus')}
              </TextInput>
            </div>

            <label className="font-semibold">{t('form.tiedostot')}</label>
            <p>{t('form.lisaa-tiedostot-kuvaus')}</p>
            <AttachmentSelector
              contentType={ContentTypeEng.OHJEET}
              language="sv"
              attachmentData={attachmentDataSv}
              handleNewAttachmentSelected={handleNewAttachmentSelected}
              handleNewAttachmentName={handleAttachmentNameChange}
              deleteFileByIndex={deleteFileByIndex}
              loading={loading}
            />
          </>
        )}
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
      />
    </div>
  )
}
