import { TextInput } from '../../TextInput'
import { FormError } from './FormErrors'
import { TextAreaInput } from '../../TextAreaInput'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { Tabs } from '../../Tabs'
import { useState } from 'react'
import { TipTap } from './editor/TipTap'

export const FormContentInput = ({
  initialContent,
  hasInstruction
}: {
  initialContent: { fi: string; sv: string }
  hasInstruction?: boolean
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('fi')

  const {
    register,
    setValue,
    formState: { errors }
  } = useFormContext()

  const contentError = errors.contentFi?.message as string
  const assignmentNameError = errors.nameRequired?.message as string
  const nameFiError = errors.nameFi?.message as string
  const nameSvError = errors.nameSv?.message as string

  const handleContentChange = (newContent: string) => {
    if (activeTab === 'fi') {
      setValue('contentFi', newContent)
    } else if (activeTab === 'sv') {
      setValue('contentSv', newContent)
    }
  }

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

        <TipTap
          onContentChange={handleContentChange}
          content={initialContent.fi}
          labelKey="form.tehtavansisalto"
          dataTestId="editor-content-fi"
          key={initialContent.fi ? 'content-fi' : 'content-fi-new'}
        />

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

        <TipTap
          onContentChange={handleContentChange}
          content={initialContent.sv}
          labelKey="form.ohjeensisalto"
          dataTestId="editor-content-sv"
          key={initialContent.sv ? 'content-sv' : 'content-sv-new'}
        />
      </div>
    </>
  )
}
