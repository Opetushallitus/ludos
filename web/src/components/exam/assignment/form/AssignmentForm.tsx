import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { Exam, ContentType, SukoAssignmentIn, PublishState } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { postAssignment, updateAssignment } from '../../../../formUtils'
import { useContext, useEffect, useState } from 'react'
import { AssignmentFormType, assignmentSchema } from './assignmentSchema'
import { Tabs } from '../../../Tabs'
import { TextAreaInput } from '../../../TextAreaInput'
import { TextInput } from '../../../TextInput'
import { FormHeader } from '../../../formCommon/FormHeader'
import { FormButtonRow } from '../../../formCommon/FormButtonRow'
import { KoodiDtoIn, KoodistoContext } from '../../../../KoodistoContext'
import { Dropdown } from '../../../Dropdown'
import { AIHE_KOODISTO, getSelectedOptions, sortKoodit } from '../../../../koodistoUtils'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { FieldLabel } from '../../../FieldLabel'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const exam = match!.params.exam as Exam
  const contentType = match!.params.contentType as ContentType

  const assignment = (state?.assignment as SukoAssignmentIn) || null

  const {
    watch,
    register,
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<AssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(assignmentSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam: exam.toUpperCase() as Exam,
        contentType: assignment.contentType.toUpperCase() as AssignmentFormType['contentType']
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
      setValue('contentType', contentType.toUpperCase() as AssignmentFormType['contentType'])
    }
  }, [assignment, exam, contentType, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: AssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<string>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<{ id: string }>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (fieldName: keyof AssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentOppimaara = watch('oppimaaraKoodiArvo')
  const currentTavoitetaso = watch('tavoitetasoKoodiArvo')
  const currentAihe = watch('aiheKoodiArvo')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvo')

  const assignmentTypeKoodisto = ctx.koodistos.tehtavatyyppisuko
  const oppimaaraKoodisto = ctx.koodistos.oppiaineetjaoppimaaratlops2021
  const tavoitetasoKoodisto = ctx.koodistos.taitotaso
  const aiheKoodisto = AIHE_KOODISTO
  const laajaalainenOsaaminenKoodisto = ctx.koodistos.laajaalainenosaaminenlops2021

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={contentType} assignment={assignment} />
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('contentType')} />

        <div className="mb-6">
          <FieldLabel id="oppimaara" name={t('form.oppimaara')} required />
          <Dropdown
            id="oppimaara"
            selectedOption={oppimaaraKoodisto && oppimaaraKoodisto.find((it) => it.koodiArvo === currentOppimaara)}
            options={sortKoodit(oppimaaraKoodisto || [])}
            onSelectedOptionsChange={(opt: string) => setValue('oppimaaraKoodiArvo', opt)}
          />
          {errors?.oppimaaraKoodiArvo && <p className="text-green-primary">{errors.oppimaaraKoodiArvo.message}</p>}
        </div>

        <div className="mb-6">
          <legend className="mb-2 font-semibold">{t('form.tehtavatyyppi')}</legend>
          <Controller
            control={control}
            name="assignmentTypeKoodiArvo"
            rules={{ required: true }}
            render={({ field }) => (
              <>
                {assignmentTypeKoodisto &&
                  assignmentTypeKoodisto.map((type, i) => (
                    <fieldset key={i} className="flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value={type.koodiArvo}
                        checked={field.value === type.koodiArvo}
                        id={type.koodiArvo}
                        data-testid={`assignmentTypeRadio-${type.koodiArvo.toLowerCase()}`}
                        className="mr-2"
                      />
                      <label htmlFor={type.koodiArvo}>{type.nimi}</label>
                    </fieldset>
                  ))}
              </>
            )}
          />
          {errors?.assignmentTypeKoodiArvo && (
            <p className="text-green-primary">{errors.assignmentTypeKoodiArvo.message}</p>
          )}
        </div>

        <div className="mb-6">
          <FieldLabel id="tavoitetaso" name={t('form.tavoitetaso')} required />
          <Dropdown
            id="tavoitetaso"
            selectedOption={
              tavoitetasoKoodisto && tavoitetasoKoodisto.find((it) => it.koodiArvo === currentTavoitetaso)
            }
            options={sortKoodit(tavoitetasoKoodisto || [])}
            onSelectedOptionsChange={(opt: string) => setValue('tavoitetasoKoodiArvo', opt)}
          />
          {errors?.tavoitetasoKoodiArvo && <p className="text-green-primary">{errors.tavoitetasoKoodiArvo.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="aihe" name={t('form.aihe')} required />
          <MultiSelectDropdown
            id="aihe"
            options={sortKoodit(aiheKoodisto || [])}
            selectedOptions={getSelectedOptions(currentAihe, aiheKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('aiheKoodiArvo', opt)}
            canReset
          />
          {errors?.aiheKoodiArvo && <p className="text-green-primary">{errors.aiheKoodiArvo.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="laajaalainenosaamine" name={t('form.laajaalainenosaaminen')} required />
          <MultiSelectDropdown
            id="laajaalainenosaamine"
            options={sortKoodit(laajaalainenOsaaminenKoodisto || [])}
            selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvo', opt)}
            canReset
          />
          {errors?.laajaalainenOsaaminenKoodiArvo && (
            <p className="text-green-primary">{errors.laajaalainenOsaaminenKoodiArvo.message}</p>
          )}
        </div>

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

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

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
      />
    </div>
  )
}
