import { Page } from '@playwright/test'
import { ContentType, ContentTypePluralFi, Exam } from 'web/src/types'

export abstract class ContentModel {
  protected constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentType: ContentType,
    readonly header = page.getByTestId('assignment-header'),
    readonly editButton = page.getByTestId('edit-content-btn'),
    readonly publishState = page.getByTestId('publish-state'),
    readonly contentFi = page.getByTestId('editor-content-FI-0'),
    readonly contentSv = page.getByTestId('editor-content-SV-0'),
    readonly instructionFi = page.getByTestId('instruction-fi'),
    readonly instructionSV = page.getByTestId('instruction-sv'),
    readonly returnButton = page.getByTestId('return')
  ) {}

  async goToContentPage(id: number) {
    await this.page.goto(`/${this.exam.toLowerCase()}/${ContentTypePluralFi[this.contentType]}/${id}`)
  }

  abstract assertAttachments(attachmentNames: string[]): Promise<void>
}
