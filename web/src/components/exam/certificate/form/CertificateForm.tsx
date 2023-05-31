import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Exam, ContentType, SukoAssignmentIn, PublishState } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { postCertificate, updateCertificate } from '../../../../formUtils'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Tabs } from '../../../Tabs'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { FormHeader } from '../../../formCommon/FormHeader'
import { FormButtonRow } from '../../../formCommon/FormButtonRow'
import { Button } from '../../../Button'
import { Icon } from '../../../Icon'

type CertificateFormProps = {
  action: 'new' | 'update'
}

export const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const exam = match!.params.exam as Exam

  const assignment = (state?.assignment as SukoAssignmentIn) || null

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
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: CertificateFormType) => {
      const body = { ...data, publishState }

      try {
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
      }
    })()
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Perform necessary operations with the uploaded file
    console.log('Uploaded file:', file)
  }

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={ContentType.TODISTUKSET} assignment={assignment} />

      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'fi' && (
          <>
            <TextInput id="nameFi" register={register} required>
              {t('form.todistuksennimi')}
            </TextInput>
            {errors?.nameFi && <p className="text-green-primary">{errors.nameFi.message}</p>}
            <TextAreaInput id="contentFi" register={register}>
              {t('form.todistuksenkuvaus')}
            </TextAreaInput>
          </>
        )}
        {activeTab === 'sv' && (
          <>
            <TextInput id="nameSv" register={register} required>
              {t('form.todistuksennimi')}
            </TextInput>
            {errors?.nameSv && <p className="text-green-primary">{errors.nameSv.message}</p>}
            <TextAreaInput id="contentSv" register={register}>
              {t('form.todistuksenkuvaus')}
            </TextAreaInput>
          </>
        )}

        <div className="mt-10 w-full md:w-2/3">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            <p className="col-span-3 md:col-span-3">Tiedoston nimi</p>
            <p className="hidden md:col-span-3 md:block">Lisätty</p>
          </div>

          <div className="border-y border-gray-light" />

          <div className="grid grid-cols-5 gap-2 py-2 md:grid-cols-6">
            <p className="col-span-4 text-green-primary md:col-span-3">Suullinenkilitaito-12-10-2020.pdf</p>
            <p className="hidden md:col-span-2 md:block">12.10.2020</p>
            <div className="text-center">
              <Icon name="poista" color="text-green-primary" />
            </div>
            <p className="col-span-4 text-green-primary md:col-span-3">Suullinenkilitaito-12-10-2020.pdf</p>
            <p className="hidden md:col-span-2 md:block">12.10.2020</p>
            <div className="text-center">
              <Icon name="poista" color="text-green-primary" />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <input
            type="file"
            id="fileInput"
            ref={hiddenFileInputRef}
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <label htmlFor="fileInput">
            <Button variant="buttonSecondary" onClick={() => hiddenFileInputRef.current?.click()}>
              Lisää liitetiedosto
            </Button>
          </label>
        </div>
      </form>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
      />
    </div>
  )
}
