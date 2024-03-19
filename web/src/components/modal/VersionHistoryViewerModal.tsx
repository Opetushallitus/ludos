import { useModal } from './useModal'
import styles from './modal.module.css'
import { ModalHeader } from './ModalHeader'
import { ContentBaseOut, ContentType } from '../../types'
import { toLocaleDate } from '../../utils/formatUtils'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { contentPagePath } from '../LudosRoutes'
import { InternalLink } from '../InternalLink'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

type ModalProps = {
  open: boolean
  onClose: (refresh?: boolean) => void
  versionList: ContentBaseOut[]
  contentType: ContentType
  restoreOldVersion: (data: ContentBaseOut) => Promise<any>
}
export const VersionHistoryViewerModal = ({
  open,
  onClose,
  versionList,
  contentType,
  restoreOldVersion
}: ModalProps) => {
  const { t } = useLudosTranslation()
  const { dialogClasses, onCancel, onAnimEnd, modalRef } = useModal({ open, onClose })

  const latestVersion = versionList.at(-1)?.version

  const update = async (data: ContentBaseOut) => {
    await restoreOldVersion(data)
    onClose(true)
  }

  return (
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onClose={() => onClose()}
      onCancel={onCancel}
      onAnimationEnd={onAnimEnd}
      aria-modal="true"
      data-testid="version-history-modal">
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={t('version-control.muokkaushistoria')} onClick={onClose} />

        <div className="h-auto min-h-[20rem] max-h-[30rem] overflow-scroll px-6 py-2">
          <table className="w-full text-left">
            <thead className="border-b border-gray-border">
              <tr>
                <th className="font-semibold pr-6 py-1">{t('version-control.versio')}</th>
                <th className="font-semibold pr-6">{t('version-control.muokattu')}</th>
                <th className="font-semibold pr-6">{t('version-control.muokkaaja')}</th>
                <th className="font-semibold pr-6">{t('version-control.toiminnot')}</th>
              </tr>
            </thead>
            <tbody>
              {versionList.toReversed().map((item) => (
                <tr className="even:bg-gray-bg" key={item.version} data-testid={`version-history-item-${item.version}`}>
                  <td className="pr-6 py-3 pl-3">{item.version}</td>
                  <td className="pr-6">{toLocaleDate(item.updatedAt)}</td>
                  <td className="pr-6" data-testid="updater">
                    {item.updaterName ?? t('version-control.tuntematon-muokkaaja')}
                  </td>
                  <td className="pr-6 w-auto whitespace-nowrap">
                    {latestVersion === item.version ? (
                      t('version-control.viimeisin-versio')
                    ) : (
                      <div className="row gap-2 flex-wrap">
                        <InternalLink
                          to={contentPagePath(item.exam, contentType, item.id, item.version)}
                          onClick={() => onClose()}
                          data-testid="show">
                          <span className="row my-auto gap-1">
                            <Icon name="katsele" color="text-green-primary" />
                            <p className="text-green-primary">{t('version-control.nayta')}</p>
                          </span>
                        </InternalLink>
                        <Button
                          variant="buttonGhost"
                          customClass="p-0"
                          onClick={() => update(item)}
                          data-testid="restore">
                          <span className="row my-auto gap-1">
                            <Icon name="palauta" color="text-green-primary" />
                            <p className="text-green-primary">{t('version-control.palauta')}</p>
                          </span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  )
}
