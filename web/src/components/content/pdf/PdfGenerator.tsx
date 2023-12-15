import { useEffect, useRef } from 'react'
import { usePDF } from '@react-pdf/renderer'
import AssignmentPdf from './AssignmentPdf'
import { BaseOut, TeachingLanguage } from '../../../types'
import { getContentName, isAssignment } from '../../../utils/assignmentUtils'
import { useTranslation } from 'react-i18next'
import InstructionPdf from './InstructionPdf'
import { isInstruction } from '../../../utils/instructionUtils'
import { useNotification } from '../../../contexts/NotificationContext'

type LazyPdfGeneratorProps = {
  baseOut: BaseOut
  language: TeachingLanguage
  onGenerated: (blob: Blob) => void
}

const PdfGenerator = ({ baseOut, language, onGenerated }: LazyPdfGeneratorProps) => {
  const { t } = useTranslation()
  const { setNotification } = useNotification()

  const [instance] = usePDF({
    document: (
      <>
        {isAssignment(baseOut) ? (
          <AssignmentPdf
            title={getContentName(baseOut, language) || t('form.nimeton')}
            assignment={baseOut}
            teachingLanguage={language}
          />
        ) : (
          isInstruction(baseOut) && (
            <InstructionPdf
              title={getContentName(baseOut, language) || t('form.nimeton')}
              instruction={baseOut}
              teachingLanguage={language}
            />
          )
        )}
      </>
    )
  })
  // varmistetaan et useEffect ajetaan vain kerran per instanssi
  const instanceHandledRef = useRef(false)

  useEffect(() => {
    if (instanceHandledRef.current) {
      return
    }

    if (instance.error) {
      setNotification({
        message: t('notification.error.pdf-generointi'),
        type: 'error'
      })
      instanceHandledRef.current = true
    } else if (instance.blob) {
      onGenerated(instance.blob)
      instanceHandledRef.current = true
    }
  }, [instance, onGenerated, setNotification, t])

  return null
}

export default PdfGenerator
