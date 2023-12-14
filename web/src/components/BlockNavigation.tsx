import { useBlocker } from 'react-router-dom'
import { BlockNavigationModal } from './modal/BlockNavigationModal'

type BlockNavigationProps = {
  shouldBlock: boolean
}

export const BlockNavigation = ({ shouldBlock }: BlockNavigationProps) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => shouldBlock && nextLocation?.pathname !== currentLocation?.pathname
  )

  return (
    <>
      {blocker.state === 'blocked' && <BlockNavigationModal open onProceed={blocker.proceed} onClose={blocker.reset} />}
    </>
  )
}
