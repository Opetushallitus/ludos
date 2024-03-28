import { Icon } from '../Icon'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const ModalHeader = ({ modalTitle, onClick }: { modalTitle: string; onClick?: () => void }) => {
  const { t } = useLudosTranslation()

  return (
    <div className="row justify-between bg-green-primary p-2">
      <h2 className="text-base text-white" id="modal-title">
        {modalTitle}
      </h2>
      {onClick && (
        <button className="modal__close-button text-right" onClick={onClick} aria-label={t('aria-label.modal.sulje')}>
          <Icon name="sulje" color="text-white" />
        </button>
      )}
    </div>
  )
}
