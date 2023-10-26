import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import styles from './modal.module.css'

export function useModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDialogElement>(null)

  const dialogClasses = useMemo(() => {
    const _arr = [styles['modal']]

    if (!open) {
      _arr.push(styles['modal--closing'])
    }

    return _arr.join(' ')
  }, [open])

  const onCancel = useCallback(() => {
    onClose()
  }, [onClose])

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const { current } = modalRef
      if (e.target === current) {
        onClose()
      }
    },
    [onClose]
  )

  const onAnimEnd = useCallback(() => {
    const { current } = modalRef
    if (!open) {
      current?.close()
    }
  }, [open])

  useEffect(() => {
    const { current } = modalRef
    if (open) {
      current?.showModal()
    } else {
      current?.close()
    }
  }, [open, onClose])

  return {
    modalRef,
    dialogClasses,
    onCancel,
    onClick,
    onAnimEnd
  }
}
