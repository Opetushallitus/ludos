import { Button } from '../../Button'
import React, { Suspense, useState } from 'react'
import { BaseOut, ContentType, ContentTypeSingularEng, Exam, TeachingLanguage } from '../../../types'
import { useTranslation } from 'react-i18next'
import { Icon } from '../../Icon'
import { getContentName } from '../../../utils/assignmentUtils'
import { Spinner } from '../../Spinner'
import { fetchData } from '../../../request'

const PdfGenerator = React.lazy(() => import('./PdfGenerator'))

type PdfDownloadButtonProps = {
  exam: Exam
  contentType: ContentType
  contentId: number
  language: TeachingLanguage
}

export default function PdfDownloadButton({ exam, contentType, contentId, language }: PdfDownloadButtonProps) {
  const { t } = useTranslation()
  const [shouldGenerate, setShouldGenerate] = useState<BaseOut>()

  const handleDownloadClick = async () => {
    const data = await fetchData<BaseOut>(`${ContentTypeSingularEng[contentType!]}/${exam}/${contentId}`)
    setShouldGenerate(data)
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

  const handleGenerated = (generatedBlob: Blob, data: BaseOut) => {
    initiateDownload(generatedBlob, getContentName(data, language))
    setShouldGenerate(undefined)
  }

  return (
    <>
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={handleDownloadClick}
        disabled={!!shouldGenerate}
        data-testid={`pdf-download-button-${language}`}>
        <Icon name="pdf" color="text-green-primary" />
        <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
      </Button>
      {shouldGenerate && (
        <Suspense fallback={<Spinner />}>
          <PdfGenerator
            baseOut={shouldGenerate}
            language={language}
            onGenerated={(blob) => handleGenerated(blob, shouldGenerate)}
          />
        </Suspense>
      )}
    </>
  )
}
