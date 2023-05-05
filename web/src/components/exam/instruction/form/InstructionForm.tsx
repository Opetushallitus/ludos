import { useForm } from 'react-hook-form'
import { Button } from '../../../Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AssignmentState, Exam, ExamType, SukoAssignmentIn } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { postInstruction, updateInstruction } from '../../../../formUtils'
import { useEffect, useState } from 'react'
import { Tabs } from '../../../Tabs'
import { InstructionFormType, instructionSchema } from './instructionSchema'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const InstructionForm = ({ action }: AssignmentFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:examType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const exam = match!.params.exam as Exam
  const examType = match!.params.examType as ExamType

  const assignment = (state?.assignment as SukoAssignmentIn) || null

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<InstructionFormType>({ mode: 'onBlur', resolver: zodResolver(instructionSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam: exam.toUpperCase() as Exam,
        examType: assignment.examType.toUpperCase() as InstructionFormType['examType']
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
      setValue('examType', examType.toUpperCase() as InstructionFormType['examType'])
    }
  }, [assignment, exam, examType, reset, setValue])

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: InstructionFormType) => {
      const body = { ...data, state }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateInstruction<string>(exam, assignment.id, body)
        } else {
          const { id } = await postInstruction<{ id: string }>(body)
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
      <div className="mb-6">
        <h2 className="mb-3" data-testid="heading">
          {action === 'new' ? t(`form.${exam}`) : assignment?.nameFi}
        </h2>
        {action === 'new' ? <p>{t('form.kuvaus')}</p> : <p>{t('form.muokkauskuvaus')}</p>}
      </div>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('examType')} />

        <div className="mb-2 text-lg font-semibold">Sisältö</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'fi' && (
          <>
            <TextInput id="nameFi" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.nameFi && <p className="text-green-primary">{errors.nameFi.message}</p>}
            <TextAreaInput id="contentFi" register={register}>
              {t('form.tehtavansisalto')}
            </TextAreaInput>
          </>
        )}
        {activeTab === 'sv' && (
          <>
            <TextInput id="nameSv" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.nameSv && <p className="text-green-primary">{errors.nameSv.message}</p>}
            <TextAreaInput id="contentSv" register={register}>
              {t('form.tehtavansisalto')}
            </TextAreaInput>
          </>
        )}
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
