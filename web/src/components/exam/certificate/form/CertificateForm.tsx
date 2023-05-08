import { useForm } from 'react-hook-form'
import { Button } from '../../../Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AssignmentState, Exam, ContentType, SukoAssignmentIn, ContentTypesSingular } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { postCertificate, updateCertificate } from '../../../../formUtils'
import { useEffect, useState } from 'react'
import { Tabs } from '../../../Tabs'
import { CertificateFormType, certificateSchema } from './certificateSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { ContentTypeTranslationFinnish } from '../../assignment/assignmentUtils'
import { FormHeader } from '../../../formCommon/FormHeader'

type CertificateFormProps = {
  action: 'new' | 'update'
}

export const CertificateForm = ({ action }: CertificateFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const exam = match!.params.exam as Exam
  const contentType = match!.params.contentType as ContentType

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
        exam: exam.toUpperCase() as Exam,
        contentType: assignment.contentType.toUpperCase() as CertificateFormType['contentType']
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
      setValue('contentType', contentType.toUpperCase() as CertificateFormType['contentType'])
    }
  }, [assignment, exam, contentType, reset, setValue])

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: CertificateFormType) => {
      const body = { ...data, state }

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

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={contentType} assignment={assignment} />

      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('contentType')} />

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

        <div className="mb-2 text-lg font-semibold">Todistus</div>
      </form>

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="buttonGhost" type="button" onClick={() => navigate(-1)} testId="form-cancel">
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Draft })}
          testId="form-draft">
          {t('button.tallennaluonnos')}
        </Button>
        <Button
          variant="buttonPrimary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Published })}
          testId="form-submit">
          {t('button.tallennajulkaise')}
        </Button>
      </div>
    </div>
  )
}
