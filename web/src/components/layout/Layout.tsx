import styles from './layout.module.scss'
import { ReactNode } from 'react'

interface TLayout {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}
export const Layout = ({ header, footer, children }: TLayout) => (
  <main className={`${styles.container} min-h-screen`}>
    <header>{header}</header>
    <section>{children}</section>
    <footer>{footer}</footer>
  </main>
)
