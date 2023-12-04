import { Button } from '../../Button'
import React, { Suspense, useState } from 'react'
import { BaseOut, TeachingLanguage } from '../../../types'
import { useTranslation } from 'react-i18next'
import { Icon } from '../../Icon'
import { getContentName, isAssignment } from '../../../utils/assignmentUtils'
import { isInstruction } from '../../../utils/instructionUtils'
import { Spinner } from '../../Spinner'

const PdfGenerator = React.lazy(() => import('./PdfGenerator'))

type PdfDownloadButtonProps = {
  baseOut: BaseOut
  language: TeachingLanguage
}

export default function PdfDownloadButton({ baseOut, language }: PdfDownloadButtonProps) {
  const { t } = useTranslation()
  const [shouldGenerate, setShouldGenerate] = useState(false)
  const documentName = isAssignment(baseOut)
    ? getContentName(baseOut, language)
    : isInstruction(baseOut) && getContentName(baseOut, language)

  const handleDownloadClick = () => setShouldGenerate(true)

  const initiateDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleGenerated = (generatedBlob: Blob) => {
    initiateDownload(generatedBlob)
    setShouldGenerate(false)
  }

  return (
    <>
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={handleDownloadClick}
        disabled={shouldGenerate}
        data-testid={`pdf-download-button-${language}`}>
        <Icon name="pdf" color="text-green-primary" />
        <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
      </Button>
      {shouldGenerate && (
        <Suspense fallback={<Spinner />}>
          <PdfGenerator baseOut={baseOut} language={language} onGenerated={handleGenerated} />
        </Suspense>
      )}
    </>
  )
}
