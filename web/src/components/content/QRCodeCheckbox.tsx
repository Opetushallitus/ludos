import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { ContentBaseOut, isPuhviAssignment, Language } from '../../types'

type QRCodeCheckboxProps = {
  data: ContentBaseOut & { isPrintPreview?: boolean }
  teachingLanguage: Language
  showQRCodes: boolean
  onToggleQRCodes: () => void
}

export const QRCodeCheckbox = ({ data, teachingLanguage, showQRCodes, onToggleQRCodes }: QRCodeCheckboxProps) => {
  const { lt } = useLudosTranslation()
  const { qrCodesForLinks } = useFeatureFlags()
  const { isPrintPreview } = data

  if (!qrCodesForLinks) {
    return null
  }

  if (!isPrintPreview) {
    return null
  }

  if (!isPuhviAssignment(data)) {
    return null
  }

  const selectedLanguageContentContainsLinks =
    teachingLanguage === Language.FI ? data.linksFi && data.linksFi.length > 0 : data.linksSv && data.linksSv.length > 0

  if (!selectedLanguageContentContainsLinks) {
    return null
  }

  return (
    <div data-testid={'qr-code-checkbox'}>
      <label className="flex items-center gap-2 cursor-pointer mb-1">
        <input type="checkbox" checked={showQRCodes} onChange={onToggleQRCodes} className="w-4 h-4 cursor-pointer" />
        <span className="text-sm">{lt.contentPageQrCodeCheckboxLabel}</span>
      </label>
    </div>
  )
}
