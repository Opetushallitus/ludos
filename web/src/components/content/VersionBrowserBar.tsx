import { ContentBaseOut, ContentTypeByContentTypePluralFi, ContentTypePluralFi } from '../../types'
import { useParams } from 'react-router-dom'
import { contentPagePath, pageNotFoundPath } from '../LudosRoutes'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../InternalLink'

type VersionBrowserBarProps = {
  data: ContentBaseOut
  dataList: ContentBaseOut[]
  openVersionBrowserClick: () => void
  stopVersionBrowsing: () => void
  restoreOldVersion: (data: ContentBaseOut) => Promise<any>
}

export const VersionBrowserBar = ({
  data,
  dataList,
  openVersionBrowserClick,
  stopVersionBrowsing,
  restoreOldVersion
}: VersionBrowserBarProps) => {
  const { t } = useTranslation()
  const { contentTypePluralFi } = useParams<{ contentTypePluralFi: ContentTypePluralFi; id: string; version: string }>()
  const contentType = ContentTypeByContentTypePluralFi[contentTypePluralFi!]

  const currentIndex = dataList.findIndex((item) => item.version === data.version)
  const hasNextVersion = currentIndex < dataList.length - 1
  const hasPreviousVersion = currentIndex > 0

  const getPathForNavigate = (index: number) => {
    const targetVersion = dataList?.at(index)
    if (!targetVersion) {
      return pageNotFoundPath
    }

    return contentPagePath(targetVersion.exam, contentType!, targetVersion.id, targetVersion.version)
  }

  const onPickVersionClick = async () => {
    const versionFromList = dataList.find((item) => item.version === data.version)!

    await restoreOldVersion(versionFromList)
    stopVersionBrowsing()
  }

  return (
    <div className="row items-center gap-5 w-full bg-gray-bg px-4">
      <div className="flex gap-2">
        {t('version-control.versio')}
        <InternalLink
          to={getPathForNavigate(currentIndex - 1)}
          disabled={!hasPreviousVersion}
          data-testid="previous-version">
          <Icon name="chevronLeft" color="text-green-primary" disabled={!hasPreviousVersion} />
        </InternalLink>
        {data.version}
        <InternalLink to={getPathForNavigate(currentIndex + 1)} disabled={!hasNextVersion} data-testid="next-version">
          <Icon name="chevronRight" color="text-green-primary" disabled={!hasNextVersion} />
        </InternalLink>
      </div>
      <Button
        variant="buttonGhost"
        customClass="p-0"
        onClick={onPickVersionClick}
        disabled={!hasNextVersion}
        data-testid="restore-version">
        <span className="row my-auto gap-1">
          <Icon name="palauta" color="text-green-primary" />
          <p className="text-green-primary">{t('version-control.palauta-tama-versio')}</p>
        </span>
      </Button>
      <Button
        variant="buttonGhost"
        customClass="p-0"
        onClick={openVersionBrowserClick}
        data-testid="open-version-browser">
        <span className="row my-auto gap-1">
          <Icon name="versiohistoria" color="text-green-primary" />
          <p className="text-green-primary">{t('version-control.muokkaushistoria')}</p>
        </span>
      </Button>
      <div className="flex-grow text-right">
        <Button
          variant="buttonGhost"
          customClass="p-0"
          onClick={stopVersionBrowsing}
          data-testid="stop-version-browsing">
          <span className="row my-auto gap-1">
            <Icon name="sulje" color="text-green-primary" />
          </span>
        </Button>
      </div>
    </div>
  )
}
