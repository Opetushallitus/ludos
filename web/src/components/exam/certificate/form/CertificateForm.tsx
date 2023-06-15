import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Exam, PublishState, ContentTypeEng, CertificateIn } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { postCertificate, updateCertificate } from '../../../../formUtils'
import { useEffect, useState } from 'react'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../assignment/form/formCommon/FormHeader'
import { FormButtonRow } from '../../assignment/form/formCommon/FormButtonRow'
import { FileUpload, UploadFile } from '../../assignment/form/formCommon/FileUpload'

type CertificateFormProps = {
  action: 'new' | 'update'
}

export const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [loading, setLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null)

  const exam = match!.params.exam as Exam

  const assignment = (state?.assignment as CertificateIn) || null

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CertificateFormType>({ mode: 'onBlur', resolver: zodResolver(certificateSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam: exam.toUpperCase() as Exam
      })
      setUploadedFile({
        fileName: assignment.fileName,
        fileKey: assignment.fileKey,
        fileUploadDate: assignment.fileUploadDate
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
    }
  }, [assignment, exam, reset, setValue])

  const handleUploadedFile = (file: UploadFile) => {
    setUploadedFile(file)
    setValue('fileName', file.fileName)
    setValue('fileKey', file.fileKey)
    setValue('fileUploadDate', file.fileUploadDate)
  }

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: CertificateFormType) => {
      const body = { ...data, publishState }

      try {
        setLoading(true)
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateCertificate<string>(exam, assignment.id, body)
        } else {
          const { id } = await postCertificate<{ id: string }>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={ContentTypeEng.TODISTUKSET} assignment={assignment} />

      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <TextInput id="nameFi" register={register} required>
          {t('form.todistuksennimi')}
        </TextInput>
        {errors?.nameFi && <p className="text-green-primary">{errors.nameFi.message}</p>}
        <TextAreaInput id="contentFi" register={register}>
          {t('form.todistuksenkuvaus')}
        </TextAreaInput>

        <div className="mb-2 mt-6 font-semibold">Todistus</div>
        <p>Lisää todistuspohja pdf-muotoisena.</p>

        <FileUpload uploadedFile={uploadedFile} setUploadedFile={handleUploadedFile} />
      </form>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
        isLoading={loading}
      />
    </div>
  )
}
