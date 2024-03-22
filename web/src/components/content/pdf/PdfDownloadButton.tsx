import { Button } from '../../Button'
import React, { Suspense, useState } from 'react'
import { AssignmentOut, ContentBaseOut, ContentType, ContentTypeSingularEn, Exam, Language } from '../../../types'
import { Icon } from '../../Icon'
import { getContentName } from '../../../utils/assignmentUtils'
import { Spinner } from '../../Spinner'
import { fetchData } from '../../../request'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

const PdfGenerator = React.lazy(() => import('./PdfGenerator'))

type PdfDownloadButtonProps = {
  exam: Exam
  contentId: number
  language: Language
}

export default function PdfDownloadButton({ exam, contentId, language }: PdfDownloadButtonProps) {
  const { t } = useLudosTranslation()
  const [assignmentShouldBeGenerated, setAssignmentShouldBeGenerated] = useState<AssignmentOut>()

  const handleDownloadClick = async () => {
    const data = await fetchData<AssignmentOut>(`${ContentTypeSingularEn[ContentType.ASSIGNMENT]}/${exam}/${contentId}`)
    setAssignmentShouldBeGenerated(data)
  }

  const initiateDownload = (blob: Blob, documentName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleGenerated = (generatedBlob: Blob, data: ContentBaseOut) => {
    initiateDownload(generatedBlob, getContentName(data, language))
    setAssignmentShouldBeGenerated(undefined)
  }

  return (
    <>
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center"
        onClick={handleDownloadClick}
        disabled={!!assignmentShouldBeGenerated}
        data-testid={`pdf-download-button-${language}`}>
        <Icon name="pdf" color="text-green-primary" />
        <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
      </Button>
      {assignmentShouldBeGenerated && (
        <Suspense fallback={<Spinner />}>
          <PdfGenerator
            assignmentOut={assignmentShouldBeGenerated}
            language={language}
            onGenerated={(blob) => handleGenerated(blob, assignmentShouldBeGenerated)}
          />
        </Suspense>
      )}
    </>
  )
}
