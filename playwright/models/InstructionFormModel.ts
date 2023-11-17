import { Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { Exam } from 'web/src/types'
import { instructionFormData } from '../all_tests/instruction/instructionHelpers'
import { EditorModel } from './EditorModel'
import { ContentType } from '../helpers'
import { ContentListModel } from './ContentListModel'

export class InstructionFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentFiEditor = new EditorModel(page, page.getByTestId('editor-content-fi')),
    readonly createNewInstructionButton = page.getByTestId('create-ohje-button')
  ) {
    super(page, exam)
  }

  async fillMinimalInstructionForm() {
    await this.nameFi.fill(instructionFormData.nameFi)
  }

  async gotoNew() {
    await new ContentListModel(this.page, this.exam, ContentType.ohjeet).goto()
    await this.createNewInstructionButton.click()
  }
}
