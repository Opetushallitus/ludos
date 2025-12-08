import { QRCodeSVG } from 'qrcode.react'
import { Language, PuhviAssignmentDtoOut } from '../../types'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

type PuhviLinksQRCodesProps = {
  assignment: PuhviAssignmentDtoOut
  teachingLanguage: Language
  showQRCodes?: boolean
  isPrintPreview?: boolean
}

export const PuhviLinksQRCodes = ({
  assignment,
  teachingLanguage,
  showQRCodes = true,
  isPrintPreview = false
}: PuhviLinksQRCodesProps) => {

  const { lt } = useLudosTranslation()

  const links = teachingLanguage === Language.FI ? assignment.linksFi : assignment.linksSv

  if (!links || links.length === 0) return null

  // In print preview: only show if checkbox is checked
  // In regular view: always render but hide on screen (show when printing)
  if (isPrintPreview && !showQRCodes) {
    return null
  }

  // If in print preview, show on screen when enabled
  // If in regular view, hide on screen but show when printing
  const visibilityClass = isPrintPreview ? '' : 'hidden print:block'

  return (
    <div className={`mt-6 border-t border-gray-separator pt-4 ${visibilityClass}`}>
      <h3 className="font-semibold text-lg mb-3">{lt.contentPageQrCodeLinksSubtitle}</h3>
      <div className="grid grid-cols-2 gap-4">
        {links.map((link, index) => (
          <div key={index} className="flex flex-col items-center border border-gray-light p-3">
            <QRCodeSVG value={link} size={120} level="M" includeMargin={true} />
            <p className="text-xs mt-2 text-center break-all max-w-full">{link}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
