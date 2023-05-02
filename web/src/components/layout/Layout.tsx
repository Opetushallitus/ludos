import { ReactNode } from 'react'

interface TLayout {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

export const Layout = ({ header, footer, children }: TLayout) => (
  <main className="grid min-h-screen max-w-full grid-rows-[6rem,1fr,7rem] gap-0">
    <header>{header}</header>
    <div className="flex justify-center">
      <div className="w-[80vw]">
        <section>{children}</section>
      </div>
    </div>
    <footer>{footer}</footer>
  </main>
)
