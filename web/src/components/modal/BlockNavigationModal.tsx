import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Button } from '../Button'
import { Icon } from '../Icon'
import styles from './modal.module.css'
import { useModal } from './useModal'

type BlockNavigationModalProps = {
  open: boolean
  onProceed: () => void
  onClose: () => void
}

export const BlockNavigationModal = ({ open, onProceed, onClose }: BlockNavigationModalProps) => {
  const { t } = useLudosTranslation()
  const { modalRef, dialogClasses, onCancel, onAnimEnd } = useModal({ open, onClose })

  return (
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onClose={onClose}
      onCancel={onCancel}
      onAnimationEnd={onAnimEnd}
      aria-modal="true"
      data-testid="block-navigation-modal"
    >
      <div className={styles['modal__container']}>
        <div className="row justify-between bg-green-primary p-2">
          <h2 className="text-base text-white" id="modal-title">
            {t('modal.title.poistua-tallentamatta')}
          </h2>
          <button className="text-right" onClick={onClose} aria-label={t('aria-label.modal.sulje')}>
            <Icon name="sulje" color="text-white" />
          </button>
        </div>

        <div className="h-[15vh] p-6">
          <p>{t('modal.body.teksti')}</p>
        </div>

        <div className="flex-grow" />

        <div className="m-8 flex justify-end gap-5">
          <Button variant="buttonGhost" onClick={onClose} data-testid="cancel">
            {t('common.peruuta')}
          </Button>
          <Button variant="buttonPrimary" onClick={onProceed} data-testid="proceed">
            {t('common.poistu-tallentamatta')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
