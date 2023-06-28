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

  const nameError = errors.nameFi?.message as string
  const contentError = errors.contentFi?.message as string

  return (
    <>
      <div className="mb-6">
        <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className={`${activeTab === 'fi' ? '' : 'hidden'}`}>
        <TextInput id="nameFi" register={register} required>
          {t('form.tehtavannimi')} *
        </TextInput>
        <FormError error={nameError} />

        {hasInstruction && (
          <TextAreaInput id="instructionFi" register={register}>
            {t('form.tehtavan_ohje')}
          </TextAreaInput>
        )}

        <TextAreaInput id="contentFi" register={register}>
          {t('form.tehtavansisalto')} *
        </TextAreaInput>
        <FormError error={contentError} />
      </div>

      <div className={`${activeTab === 'sv' ? '' : 'hidden'}`}>
        <TextInput id="nameSv" register={register} required>
          {t('form.tehtavannimi')}
        </TextInput>

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
