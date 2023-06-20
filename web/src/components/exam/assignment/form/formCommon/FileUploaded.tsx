import { useTranslation } from 'react-i18next'
import { Spinner } from '../../../../Spinner'
import { ExternalLink } from '../../../../ExternalLink'
import { PREVIEW_CERTIFICATION_PDF_URL } from '../../../../../constants'
import { toLocaleDate } from '../../../../../formatUtils'
import { UploadFile } from './FileUpload'

type UploadedFileProps = {
  file: UploadFile | null
  loading?: boolean
}

export const FileUploaded = ({ file, loading }: UploadedFileProps) => {
  const { t } = useTranslation()

  return (
    <div className="w-full md:w-1/3">
      <div className="grid grid-cols-6 gap-2">
        <p className="col-span-4 md:col-span-4">{t('file.nimi')}</p>
        <p className="col-span-2 md:col-span-2 md:block">{t('file.lisatty')}</p>
      </div>

      <div className="border-y border-gray-light" />
      {loading ? (
        <div className="py-2">
          <Spinner />
        </div>
      ) : (
        <>
          {file && (
            <div className="grid grid-cols-6 gap-2 py-2" data-testid={file.fileName}>
              <ExternalLink
                className="col-span-4 text-green-primary"
                url={`${PREVIEW_CERTIFICATION_PDF_URL}/${file.fileKey}`}>
                {file.fileName}
              </ExternalLink>
              <p className="col-span-2">{toLocaleDate(file.fileUploadDate)}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
