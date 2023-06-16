import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { Controller, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { Tabs } from '../../../Tabs'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { PuhviAssignmentFormType, PuhviAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Exam, PublishState, PuhviAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../formUtils'
import { useKoodisto } from '../../../../hooks/useKoodisto'

type PuhviAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: PuhviAssignmentIn
  pathname: string
  exam: Exam
}

export const PuhviAssignmentForm = ({ action, assignment, pathname, exam }: PuhviAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    watch,
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<PuhviAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(PuhviAssignmentSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam
      })
    } else {
      setValue('exam', exam)
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: PuhviAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<PuhviAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<PuhviAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (fieldName: keyof PuhviAssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppipuhvi
  const lukuvuosiKoodisto = koodistos.ludoslukuvuosi
  const laajaalainenOsaaminenKoodisto = koodistos.laajaalainenosaaminenlops2021

  return (
    <>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />

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
          <FieldLabel id="lukuvuosiKoodiArvos" name={t('form.lukuvuosi')} required />
          <MultiSelectDropdown
            id="lukuvuosiKoodiArvos"
            options={sortKooditAlphabetically(lukuvuosiKoodisto || [])}
            selectedOptions={getSelectedOptions(currentLukuvuosi, lukuvuosiKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('lukuvuosiKoodiArvos', opt)}
            testId="lukuvuosiKoodiArvos"
            canReset
          />
          {errors?.lukuvuosiKoodiArvos && <p className="text-green-primary">{errors.lukuvuosiKoodiArvos.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="laajaalainenOsaaminenKoodiArvos" name={t('form.laaja-alainen_osaaminen')} />
          <MultiSelectDropdown
            id="laajaalainenOsaaminenKoodiArvos"
            options={sortKooditAlphabetically(laajaalainenOsaaminenKoodisto || [])}
            selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
            testId="laajaalainenOsaaminenKoodiArvos"
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
