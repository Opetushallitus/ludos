import { FieldLabel } from '../../../FieldLabel'
import { Dropdown } from '../../../Dropdown'
import { getSelectedOptions, sortKooditAlphabetically, sortKooditByArvo } from '../../../../koodistoUtils'
import { Controller, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { Tabs } from '../../../Tabs'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { SukoAssignmentFormType, sukoAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Exam, PublishState, SukoAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../formUtils'
import { useKoodisto } from '../../../../hooks/useKoodisto'

type SukoAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: SukoAssignmentIn
  pathname: string
}

export const SukoAssignmentForm = ({ action, assignment, pathname }: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fi')
  const exam = Exam.Suko

  const {
    watch,
    register,
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<SukoAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(sukoAssignmentSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam
      })
    } else {
      setValue('exam', exam)
      setValue('aiheKoodiArvos', [])
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: SukoAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<SukoAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<SukoAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (fieldName: keyof SukoAssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentOppimaara = watch('oppimaaraKoodiArvo')
  const currentTavoitetaso = watch('tavoitetasoKoodiArvo')
  const currentAihe = watch('aiheKoodiArvos')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppisuko || []
  const oppimaaraKoodisto = sortKooditAlphabetically(koodistos.oppiaineetjaoppimaaratlops2021 || [])
  const tavoitetasoKoodisto = sortKooditByArvo(koodistos.taitotaso || [])
  const aiheKoodisto = sortKooditAlphabetically(koodistos.aihesuko || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])

  return (
    <>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

        <div className="mb-6">
          <FieldLabel id="oppimaara" name={t('form.oppimaara')} required />
          <Dropdown
            id="oppimaara"
            selectedOption={oppimaaraKoodisto.find((it) => it.koodiArvo === currentOppimaara)}
            options={oppimaaraKoodisto}
            onSelectedOptionsChange={(opt: string) => setValue('oppimaaraKoodiArvo', opt)}
            testId="oppimaara"
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
            options={tavoitetasoKoodisto}
            onSelectedOptionsChange={(opt: string) => setValue('tavoitetasoKoodiArvo', opt)}
            testId="tavoitetaso"
          />
          {errors?.tavoitetasoKoodiArvo && <p className="text-green-primary">{errors.tavoitetasoKoodiArvo.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="aihe" name={t('form.aihe')} />
          <MultiSelectDropdown
            id="aihe"
            options={aiheKoodisto}
            selectedOptions={getSelectedOptions(currentAihe, aiheKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('aiheKoodiArvos', opt)}
            testId="aihe"
            canReset
          />
          {errors?.aiheKoodiArvos && <p className="text-green-primary">{errors.aiheKoodiArvos.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="laajaalainenOsaaminen" name={t('form.laaja-alainen_osaaminen')} />
          <MultiSelectDropdown
            id="laajaalainenOsaamine"
            options={laajaalainenOsaaminenKoodisto}
            selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
            testId="laajaalainenOsaaminen"
            canReset
          />
          {errors?.laajaalainenOsaaminenKoodiArvos && (
            <p className="text-green-primary">{errors.laajaalainenOsaaminenKoodiArvos.message}</p>
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
            <TextAreaInput id="instructionFi" register={register}>
              {t('form.tehtavan_ohje')}
            </TextAreaInput>
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
            <TextAreaInput id="instructionSv" register={register}>
              {t('form.tehtavan_ohje')}
            </TextAreaInput>
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
    </>
  )
}
