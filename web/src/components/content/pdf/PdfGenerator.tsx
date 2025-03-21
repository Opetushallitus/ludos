import { useContext, useEffect, useRef } from 'react'
import { usePDF } from '@react-pdf/renderer'
import AssignmentPdf from './AssignmentPdf'
import { AssignmentOut, Language } from '../../../types'
import { getContentName } from '../../../utils/assignmentUtils'
import { useNotification } from '../../../contexts/NotificationContext'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { LudosContext } from '../../../contexts/LudosContext'

type LazyPdfGeneratorProps = {
  assignmentOut: AssignmentOut
  language: Language
  onGenerated: (blob: Blob) => void
}

const PdfGenerator = ({ assignmentOut, language, onGenerated }: LazyPdfGeneratorProps) => {
  const { t } = useLudosTranslation()
  const { setNotification } = useNotification()
  const { features } = useContext(LudosContext)

  const [instance] = usePDF({
    document: (
      <AssignmentPdf
        title={getContentName(assignmentOut, language) || t('form.nimeton')}
        assignment={assignmentOut}
        teachingLanguage={language}
        features={features}
      />
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
