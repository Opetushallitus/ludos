import { FieldLabel } from '../../../FieldLabel'
import { Dropdown } from '../../../Dropdown'
import { getSelectedOptions, sortKoodit } from '../../../../koodistoUtils'
import { useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { Tabs } from '../../../Tabs'
import { TextInput } from '../../../TextInput'
import { TextAreaInput } from '../../../TextAreaInput'
import { PuhviAndLdAssignmentFormType, puhviAndLdAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn, KoodistoContext } from '../../../../KoodistoContext'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentType, Exam, PublishState, SukoAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../../formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../formUtils'

type SukoAssignmentFormProps = {
  action: 'new' | 'update'
  assignment: SukoAssignmentIn
  contentType: ContentType
  pathname: string
  exam: Exam
}

export const PuhviAndLdAssignmentForm = ({
  action,
  assignment,
  contentType,
  pathname,
  exam
}: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    watch,
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<PuhviAndLdAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(puhviAndLdAssignmentSchema) })

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam,
        contentType: assignment.contentType.toUpperCase() as PuhviAndLdAssignmentFormType['contentType']
      })
    } else {
      setValue('exam', exam)
      setValue('contentType', contentType.toUpperCase() as PuhviAndLdAssignmentFormType['contentType'])
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, contentType, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: PuhviAndLdAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<PuhviAndLdAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<PuhviAndLdAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (
    fieldName: 'laajaalainenOsaaminenKoodiArvos',
    selectedOptions: KoodiDtoIn[]
  ) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvo')

  const lukuvuosiKoodisto = ctx.koodistos.ludoslukuvuosi
  const laajaalainenOsaaminenKoodisto = ctx.koodistos.laajaalainenosaaminenlops2021

  return (
    <>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('contentType')} />

        <div className="mb-6">
          <FieldLabel id="tavoitetaso" name={t('form.lukuvuosi')} required />
          <Dropdown
            id="lukuvuosi"
            selectedOption={lukuvuosiKoodisto && lukuvuosiKoodisto.find((it) => it.koodiArvo === currentLukuvuosi)}
            options={sortKoodit(lukuvuosiKoodisto || [])}
            onSelectedOptionsChange={(opt: string) => setValue('lukuvuosiKoodiArvo', opt)}
            testId="lukuvuosi"
          />
          {errors?.lukuvuosiKoodiArvo && <p className="text-green-primary">{errors.lukuvuosiKoodiArvo.message}</p>}
        </div>

        <div className="mb-6">
          <FieldLabel id="laajaalainenOsaaminen" name={t('form.laaja-alainen_osaaminen')} required />
          <MultiSelectDropdown
            id="laajaalainenOsaamine"
            options={sortKoodit(laajaalainenOsaaminenKoodisto || [])}
            selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
            onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
            testId="laajaalainenOsaaminen"
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
            <TextAreaInput id="instructioSv" register={register}>
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
