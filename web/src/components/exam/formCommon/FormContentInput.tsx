import { TextInput } from '../../TextInput'
import { FormError } from './FormErrors'
import { TextAreaInput } from '../../TextAreaInput'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { Tabs } from '../../Tabs'
import { useState } from 'react'

export const FormContentInput = ({ hasInstruction }: { hasInstruction?: boolean }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    register,
    formState: { errors }
  } = useFormContext()

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
        <TextInput id="nameFi" register={register} error={!!nameFiError || !!assignmentNameError} required>
          {t('form.tehtavannimi')}
        </TextInput>
        <FormError error={nameFiError || assignmentNameError} />

        {hasInstruction && (
          <TextAreaInput id="instructionFi" register={register}>
            {t('form.tehtavan_ohje')}
          </TextAreaInput>
        )}

        <TextAreaInput id="contentFi" register={register}>
          {t('form.tehtavansisalto')}
        </TextAreaInput>
      </div>

      <div className={`${activeTab === 'sv' ? '' : 'hidden'}`}>
        <TextInput id="nameSv" register={register} error={!!nameSvError || !!assignmentNameError} required>
          {t('form.tehtavannimi')}
        </TextInput>
        <FormError error={nameSvError || assignmentNameError} />

        {hasInstruction && (
          <TextAreaInput id="instructionSv" register={register}>
            {t('form.tehtavan_ohje')}
          </TextAreaInput>
        )}

        <TextAreaInput id="contentSv" register={register}>
          {t('form.tehtavansisalto')}
        </TextAreaInput>
      </div>
    </>
  )
}
