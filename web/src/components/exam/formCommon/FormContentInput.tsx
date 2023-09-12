import { TextInput } from '../../TextInput'
import { FormError } from './FormErrors'
import { TextAreaInput } from '../../TextAreaInput'
import { useTranslation } from 'react-i18next'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { Tabs } from '../../Tabs'
import { useEffect, useState } from 'react'
import { TipTap } from './editor/TipTap'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { Exam } from '../../../types'

interface Field {
  id: string
  content?: string
}

const ArrayContentField = ({ fieldName }: { fieldName: string }) => {
  const { t } = useTranslation()
  const { watch, control, setValue } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName
  })

  const watchContent = watch(fieldName)
  const watchExam = watch('exam')

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
                labelKey="form.tehtavansisalto"
                dataTestId={`${fieldName}-${index}`}
                key={index}
              />
            )}
          />

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

type FormContentInputProps = {
  hasInstruction?: boolean
}

export const FormContentInput = ({ hasInstruction }: FormContentInputProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    register,
    formState: { errors }
  } = useFormContext()

  const contentError = errors.contentFi?.message as string
  const assignmentNameError = errors.nameRequired?.message as string
  const nameFiError = errors.nameFi?.message as string
  const nameSvError = errors.nameSv?.message as string

  return (
    <>
      <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

      <div className="mb-6">
        <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className={`${activeTab === 'fi' ? '' : 'hidden'}`}>
        <TextInput
          id="nameFi"
          register={register}
          deps={['nameRequired']}
          error={!!nameFiError || !!assignmentNameError}
          required>
          {t('form.tehtavannimi')}
        </TextInput>
        <FormError error={nameFiError || assignmentNameError} />

        {hasInstruction && (
          <TextAreaInput id="instructionFi" register={register}>
            {t('form.tehtavan_ohje')}
          </TextAreaInput>
        )}

        <ArrayContentField fieldName="contentFi" />

        <FormError error={contentError} />
      </div>

      <div className={`${activeTab === 'sv' ? '' : 'hidden'}`}>
        <TextInput
          id="nameSv"
          register={register}
          deps={['nameRequired']}
          error={!!nameSvError || !!assignmentNameError}
          required>
          {t('form.tehtavannimi')}
        </TextInput>
        <FormError error={nameSvError || assignmentNameError} />

        {hasInstruction && (
          <TextAreaInput id="instructionSv" register={register}>
            {t('form.tehtavan_ohje')}
          </TextAreaInput>
        )}

        <ArrayContentField fieldName="contentSv" />
      </div>
    </>
  )
}
