import { useTranslation } from 'react-i18next'
import { Spinner } from '../../../../Spinner'
import { ExternalLink } from '../../../../ExternalLink'
import { PREVIEW_CERTIFICATION_PDF_URL } from '../../../../../constants'
import { toLocaleDate } from '../../../../../formatUtils'
import { Icon } from '../../../../Icon'
import { UploadFile } from './FileUpload'

type UploadedFileProps = {
  file: UploadFile | null
  loading?: boolean
  canDelete?: boolean
}

export const FileUploaded = ({ file, loading, canDelete }: UploadedFileProps) => {
  const { t } = useTranslation()

  return (
    <div className="w-full md:w-1/2">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        <p className="col-span-3 md:col-span-3">{t('file.nimi')}</p>
        <p className="hidden md:col-span-3 md:block">{t('file.lisatty')}</p>
      </div>

      <div className="border-y border-gray-light" />
      {loading ? (
        <div className="py-2">
          <Spinner />
        </div>
      ) : (
        <>
          {file && (
            <div className="grid grid-cols-5 gap-2 py-2 md:grid-cols-6">
              <ExternalLink
                className="col-span-4 text-green-primary md:col-span-3"
                url={`${PREVIEW_CERTIFICATION_PDF_URL}/${file.fileKey}`}>
                {file.fileName}
              </ExternalLink>
              <p className="hidden md:col-span-2 md:block">{toLocaleDate(file.fileUploadDate)}</p>
              {canDelete && (
                <div className="text-center">
                  <Icon name="poista" color="text-green-primary" />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
