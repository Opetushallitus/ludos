import { Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { ContentListModel } from './ContentListModel'

export class CertificateContentListModel extends ContentListModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam
  ) {
    super(page, exam, ContentType.todistukset)
  }
}
