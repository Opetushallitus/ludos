import { TextInput } from '../../TextInput'
import { FormError } from './FormErrors'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { LanguageTabs } from '../../LanguageTabs'
import { useContext, useEffect, useState } from 'react'
import { TipTap } from './editor/TipTap'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { Exam, Language } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { LudosContext } from '../../../contexts/LudosContext'

interface Field {
  id: string
  content?: string
}

const ArrayContentField = ({ fieldName, overridingLabel }: { fieldName: string; overridingLabel?: string }) => {
  const { t } = useLudosTranslation()
  const {
    watch,
    control,
    setValue,
    formState: { errors }
  } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName
  })

  const watchContent = watch(fieldName)
  const watchExam = watch('exam')
  const contentError = errors[fieldName]?.message as string

  useEffect(() => {
    const initContent = (watchContent as string[]) || []
    if (initContent.length === 0) {
      append('')
    } else {
      initContent.forEach((content, index) => {
        setValue(`${fieldName}[${index}]`, content)
      })
    }
  }, [setValue, fieldName, watchContent, append])

  const handleContentChange = (newContent: string, index: number) => setValue(`${fieldName}[${index}]`, newContent)
  const addNewField = () => append('')
  const removeField = (index: number) => remove(index)

  const typedFields = fields as Field[]

  return (
    <div>
      {typedFields.map((field, index) => (
        <div key={field.id}>
          <Controller
            name={`${fieldName}[${index}]`}
            control={control}
            render={({ field }) => (
              <TipTap
                onContentChange={(newContent) => handleContentChange(newContent, index)}
                content={field.value || ''}
                label={overridingLabel || t('form.tehtavansisalto')}
                dataTestId={`${fieldName}-${index}`}
                key={index}
                fieldError={!!errors[fieldName]}
              />
            )}
          />

          <FormError error={contentError} name={`${fieldName}[${index}]`} />

          {index === typedFields.length - 1 && typedFields.length > 1 && (
            <div className="row w-100 justify-end mt-1">
              <Button
                variant="buttonGhost"
                customClass="p-1"
                onClick={() => removeField(index)}
                data-testid={`${fieldName}-delete-content-field-${index}`}>
                <span className="row my-auto ml-3 gap-1">
                  <Icon name="poista" color="text-green-primary" />
                  <p className="text-green-primary">{t('form.poista-kentta')}</p>
                </span>
              </Button>
            </div>
          )}
        </div>
      ))}
      {/* if exam is ld show 'add new field' button */}
      {watchExam === Exam.LD && (
        <Button
          variant="buttonGhost"
          customClass="p-1 mt-1"
          onClick={addNewField}
          data-testid={`${fieldName}-add-content-field`}>
          <span className="row my-auto gap-1">
            <Icon name="lisää" color="text-green-primary" />
            <p className="text-green-primary">{t('form.lisaa-kentta')}</p>
          </span>
        </Button>
      )}
    </div>
  )
}

interface FormContentInputProps {
  formDataIsLoaded: boolean
}

const SwedishContent = () => {
  const { t } = useLudosTranslation()
  const { features } = useContext(LudosContext)
  const {
    setValue,
    control,
    watch,
    formState: { errors }
  } = useFormContext()

  if (!features.additionalSvContentForKertominen) return null

  const fieldName = 'contentSv[0]'
  const watchedContent = watch(fieldName)
  return (
    <div>
      <Controller
        control={control}
        render={() => {
          return (
            <TipTap
              onContentChange={(newContent) => setValue(fieldName, newContent)}
              content={watchedContent}
              dataTestId={'swedish-content'}
              label={t('form.tehtavansisaltoruotsiksi')}
              fieldError={!!errors[fieldName]}
            />
          )
        }}
        name={fieldName}
      />
      <FormError error={errors[fieldName]?.message as string} name={fieldName} />
    </div>
  )
}

export const FormContentInput = ({ formDataIsLoaded }: FormContentInputProps) => {
  const { t } = useLudosTranslation()
  const [activeTab, setActiveTab] = useState<Language>('FI')

  const {
    watch,
    register,
    setValue,
    formState: { errors }
  } = useFormContext()

  const currentExam = watch('exam')

  const handleContentChange = (newContent: string) => {
    if (activeTab === Language.FI) {
      setValue('instructionFi', newContent, { shouldDirty: true })
    } else if (activeTab === Language.SV) {
      setValue('instructionSv', newContent, { shouldDirty: true })
    }
  }

  const assignmentNameError = errors.nameRequired?.message as string
  const nameFiError = errors.nameFi?.message as string
  const nameSvError = errors.nameSv?.message as string

  const watchInstructionFi = watch('instructionFi')
  const watchInstructionSv = watch('instructionSv')
  const watchAssignmentTypeKoodiArvo = watch('assignmentTypeKoodiArvo')

  const showAdditionalContentSv =
    currentExam === Exam.SUKO && watchAssignmentTypeKoodiArvo && watchAssignmentTypeKoodiArvo === '002'

  return (
    <>
      <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

      {currentExam !== Exam.SUKO && (
        <div className="mb-6">
          <LanguageTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}

      <div className={`${activeTab === 'FI' || currentExam === Exam.SUKO ? '' : 'hidden'}`}>
        <TextInput
          id="nameFi"
          register={register}
          deps={['nameRequired']}
          error={nameFiError || assignmentNameError}
          required>
          {t('form.tehtavannimi')}
        </TextInput>

        <TipTap
          onContentChange={handleContentChange}
          content={watchInstructionFi}
          label={t('form.tehtavan_ohje')}
          dataTestId="editor-instruction-fi"
          key={`instruction-fi-${formDataIsLoaded ? 'loaded' : 'not-loaded'}`}
        />

        <ArrayContentField fieldName="contentFi" />
        {showAdditionalContentSv && <SwedishContent />}
      </div>

      {currentExam !== Exam.SUKO && (
        <div className={`${activeTab === 'SV' ? '' : 'hidden'}`}>
          <TextInput
            id="nameSv"
            register={register}
            deps={['nameRequired']}
            error={nameSvError || assignmentNameError}
            required>
            {t('form.tehtavannimi')}
          </TextInput>

          <TipTap
            onContentChange={handleContentChange}
            content={watchInstructionSv}
            label={t('form.tehtavan_ohje')}
            dataTestId="editor-instruction-sv"
            key={`instruction-fi-${formDataIsLoaded ? 'loaded' : 'not-loaded'}`}
          />

          <ArrayContentField fieldName="contentSv" />
        </div>
      )}
    </>
  )
}
