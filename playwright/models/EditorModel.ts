import { expect, Locator, Page } from '@playwright/test'
import { ImageEditorModel } from './ImageEditorModel'

export class EditorModel {
  constructor(
    readonly page: Page,
    readonly mainElement: Locator,
    readonly content = mainElement.locator('div[contenteditable="true"]'),
    readonly imageFileInput = mainElement.getByTestId('image-file-input')
  ) {}

  async uploadImage(imageFilePath: string, altText: string) {
    await this.imageFileInput.setInputFiles(imageFilePath)
    const imageEditor = await this.imageEditorByAltText('')
    await imageEditor.altInput.fill(altText)
  }

  async imageEditorByAltText(altText: string): Promise<ImageEditorModel> {
    const nodeView = this.content.locator(`[data-alt="${altText}"]`)
    await expect(nodeView).toBeVisible()
    return new ImageEditorModel(this.page, nodeView)
  }
}
