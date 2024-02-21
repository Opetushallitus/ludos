import { expect, Locator, Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { BaseModel } from './BaseModel'

export class FormModel extends BaseModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly formHeader = page.getByTestId('assignment-header'),
    readonly heading = page.getByTestId('heading'),
    readonly tabFi = page.getByTestId('tab-fi'),
    readonly tabSv = page.getByTestId('tab-sv'),
    readonly nameFi = page.getByTestId('nameFi'),
    readonly nameSv = page.getByTestId('nameSv'),
    readonly instructionFi = page.getByTestId('instructionFi'),
    readonly instructionSv = page.getByTestId('instructionSv'),
    readonly aineKoodiArvo = page.getByTestId('aineKoodiArvo'),
    readonly submitButton = page.getByTestId('form-submit'),
    readonly draftButton = page.getByTestId('form-draft'),
    readonly cancelButton = page.getByTestId('form-cancel'),
    readonly editContentButton = page.getByTestId('edit-content-btn'),
    readonly blockNavigationModal = page.getByTestId('block-navigation-modal'),
    readonly deleteButton = page.getByTestId('form-delete'),
    readonly modalDeleteButton = page.getByTestId('modal-button-delete'),
    readonly attachmentInputFi = page.getByTestId('file-input-fi'),
    readonly attachmentInputSv = page.getByTestId('file-input-sv'),
    readonly formErrorMsgNameFi = page.getByTestId('error-message-nameFi'),
    readonly formErrorMsgNameSv = page.getByTestId('error-message-nameSv'),
    readonly formErrorMsgList = page.getByTestId('form-error-msg-list'),
    readonly formErrorMsgDescriptionFi = page.getByTestId('error-message-descriptionFi'),
    readonly formErrorMsgDescriptionSv = page.getByTestId('error-message-descriptionSv'),
    readonly formErrorMsgAttachmentFi = page.getByTestId('error-message-attachmentFi'),
    readonly formErrorMsgAttachmentSv = page.getByTestId('error-message-attachmentSv'),
    readonly formErrorMsgAssignmentType = page.getByTestId('error-message-assignmentTypeKoodiArvo'),
    readonly formErrorMsgAineKoodiArvo = page.getByTestId('error-message-aineKoodiArvo')
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

  async fillFieldAndAssertErrorVisibility(locator: Locator, fillFieldFn: () => Promise<void>) {
    await expect(locator).toBeVisible()
    await fillFieldFn()
    await expect(locator).toBeHidden()
  }
}
