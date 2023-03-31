import styles from './layout.module.scss'
import { ReactNode } from 'react'
import { Breadcrumbs } from '../Breadcrumbs'

interface TLayout {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}

export const Layout = ({ header, footer, children }: TLayout) => (
  <main className={`${styles.container} ${styles.borderTop}`}>
    <header>{header}</header>
    <div className={styles.breadcrumb}>
      <Breadcrumbs />
    </div>
    <section>{children}</section>
    <footer>{footer}</footer>
  </main>
)
