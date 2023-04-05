import styles from './layout.module.scss'
import { ReactNode } from 'react'

interface TLayout {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

export const Layout = ({ header, footer, children }: TLayout) => (
  <main className={`${styles.container} ${styles.borderTop}`}>
    <header>{header}</header>
    <div className="flex justify-center">
      <div className="w-[80vw]">
        <section>{children}</section>
      </div>
    </div>
    <footer>{footer}</footer>
  </main>
)
