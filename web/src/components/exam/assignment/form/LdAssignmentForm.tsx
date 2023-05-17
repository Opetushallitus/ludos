import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { Tabs } from '../../../Tabs'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { LdAssignmentFormType, LdAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../KoodistoContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentType, Exam, LdAssignmentIn, PublishState } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../formUtils'
import { Dropdown } from '../../../Dropdown'
import { useKoodisto } from '../../../../hooks/useKoodisto'

type LdAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: LdAssignmentIn
  contentType: ContentType
  pathname: string
  exam: Exam
}

export const LdAssignmentForm = ({ action, assignment, contentType, pathname, exam }: LdAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    watch,
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LdAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(LdAssignmentSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam,
        contentType: assignment.contentType.toUpperCase() as LdAssignmentFormType['contentType']
      })
    } else {
      setValue('exam', exam)
      setValue('contentType', contentType.toUpperCase() as LdAssignmentFormType['contentType'])
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, contentType, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: LdAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<LdAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<LdAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (
    fieldName: 'laajaalainenOsaaminenKoodiArvos' | 'lukuvuosiKoodiArvos' | 'aineKoodiArvo',
    selectedOptions: KoodiDtoIn[]
  ) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')
  const currentAine = watch('aineKoodiArvo')

  const lukuvuosiKoodisto = sortKooditAlphabetically(koodistos.ludoslukuvuosi || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])
  const aineKoodisto = sortKooditAlphabetically(koodistos.ludoslukiodiplomiaine || [])

  return (
    <>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('contentType')} />

        <div className="mb-6">
          <FieldLabel id="aineKoodiArvo" name={t('form.aine')} required />
          <Dropdown
            id="aineKoodiArvo"
            selectedOption={aineKoodisto.find((it) => it.koodiArvo === currentAine)}
            options={aineKoodisto}
            onSelectedOptionsChange={(opt: string) => setValue('aineKoodiArvo', opt)}
            testId="aineKoodiArvo"
          />
          {errors?.lukuvuosiKoodiArvos && <p className="text-green-primary">{errors.lukuvuosiKoodiArvos.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="lukuvuosiKoodiArvos" name={t('form.lukuvuosi')} required />
          <MultiSelectDropdown
            id="lukuvuosiKoodiArvos"
            options={lukuvuosiKoodisto}
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
            options={laajaalainenOsaaminenKoodisto}
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
