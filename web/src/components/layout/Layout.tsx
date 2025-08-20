import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { IS_MOBILE_QUERY } from '../../constants'
import { useMatomoTracking } from '../../hooks/useMatomoTracking'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Footer } from '../Footer'
import { Header } from '../header/Header'
import { Notification } from '../Notification'

interface TLayout {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export const Layout = ({ header = <Header />, footer = <Footer />, children }: TLayout) => {
  useMatomoTracking()
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  return (
    <main className={twMerge('grid min-h-[98vh] max-w-full main-grid gap-0', isMobile && 'grid-rows-[3rem,1fr,7rem]')}>
      <header className="border-t-5 border-green-primary">{header}</header>
      <Notification />
      <div className="flex justify-center">
        <section className="w-[80vw]">{children}</section>
      </div>
      <footer>{footer}</footer>
    </main>
  )
}
