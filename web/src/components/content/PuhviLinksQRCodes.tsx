import { QRCodeSVG } from 'qrcode.react'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Language, PuhviAssignmentDtoOut } from '../../types'

type PuhviLinksQRCodesProps = {
  assignment: PuhviAssignmentDtoOut
  teachingLanguage: Language
  showQRCodes?: boolean
}

export const PuhviLinksQRCodes = ({ assignment, teachingLanguage, showQRCodes = true }: PuhviLinksQRCodesProps) => {
  const { qrCodesForLinks } = useFeatureFlags()
  const { lt } = useLudosTranslation()

  if (!showQRCodes) {
    return null
  }

  // Don't render if feature flag is disabled
  if (!qrCodesForLinks) {
    return null
  }

  const links = teachingLanguage === Language.FI ? assignment.linksFi : assignment.linksSv

  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className={`mt-6 border-t border-gray-separator pt-4`}>
      <h3 className="font-semibold text-lg mb-3">{lt.contentPageQrCodeLinksSubtitle}</h3>
      <div className="grid grid-cols-2 gap-4">
        {links.map((link, index) => (
          <div key={index} className="flex flex-col items-center border border-gray-light p-3">
            <QRCodeSVG value={link} size={120} level="H" marginSize={4} />
            <p className="text-xs mt-2 text-center break-all max-w-full">{link}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
