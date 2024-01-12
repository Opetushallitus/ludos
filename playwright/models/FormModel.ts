import { expect, Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { BaseModel } from './BaseModel'

export class FormModel extends BaseModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly formHeader = page.getByTestId('assignment-header'),
    readonly heading = page.getByTestId('heading'),
    readonly nameFi = page.getByTestId('nameFi'),
    readonly nameSv = page.getByTestId('nameSv'),
    readonly submitButton = page.getByTestId('form-submit'),
    readonly draftButton = page.getByTestId('form-draft'),
    readonly cancelButton = page.getByTestId('form-cancel'),
    readonly editContentButton = page.getByTestId('edit-content-btn'),
    readonly blockNavigationModal = page.getByTestId('block-navigation-modal'),
    readonly deleteButton = page.getByTestId('form-delete'),
    readonly modalDeleteButton = page.getByTestId('modal-button-delete')
  ) {
    super(page, exam)
  }

  async goToContentPage(contentType: ContentType, id: number) {
    await this.page.goto(`${this.exam.toLowerCase()}/${contentType}/${id}`)
  }

  async assertNavigationBlockOnDirtyForm() {
    await this.page.getByTestId('nav-link-etusivu').click()
    await expect(this.blockNavigationModal).toBeVisible()
    await this.blockNavigationModal.getByTestId('cancel').click()
    await expect(this.blockNavigationModal).toBeHidden()
  }

  async assertNavigationNoBlockOnCleanForm() {
    await this.page.getByTestId('nav-link-etusivu').click()
    await expect(this.blockNavigationModal).toBeHidden()
    await this.page.goBack()
  }
}
