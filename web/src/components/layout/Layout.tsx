import { ReactNode } from 'react'
import { Header } from '../header/Header'
import { Footer } from '../Footer'

interface TLayout {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export const Layout = ({ header = <Header />, footer = <Footer />, children }: TLayout) => (
  <main className="grid min-h-[98vh] max-w-full grid-rows-[6rem,1fr,7rem] gap-0">
    <header className="border-t-5 border-green-primary">{header}</header>
    <div className="flex justify-center">
      <div className="w-[80vw]">
        <section>{children}</section>
      </div>
    </div>
    <footer>{footer}</footer>
  </main>
)
