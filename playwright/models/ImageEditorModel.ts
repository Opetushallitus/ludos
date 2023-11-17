import { expect, Locator, Page } from '@playwright/test'
import { ImageAlignOption, ImageSizeOption } from 'web/src/types'

const sizeRadioTestId = (size: ImageSizeOption) => `image-size-radio-${size}`
const alignRadioTestId = (align: ImageAlignOption) => `image-align-radio-${align}`

export class ImageEditorModel {
  constructor(
    readonly page: Page,
    readonly nodeView: Locator,
    readonly altInput = nodeView.getByTestId('image-alt-input')
  ) {}

  async selectImageSize(size: ImageSizeOption) {
    await this.nodeView.getByTestId(sizeRadioTestId(size)).check()
  }
  async selectImageAlign(align: ImageAlignOption) {
    await this.nodeView.getByTestId(alignRadioTestId(align)).check()
  }

  async assertImageOptions(expectedSize: ImageSizeOption, expectedAlign: ImageAlignOption) {
    for (const size of Object.values(ImageSizeOption)) {
      const sizeRadioButton = this.nodeView.getByTestId(sizeRadioTestId(size))
      if (size === expectedSize) {
        await expect(sizeRadioButton).toBeChecked()
      } else {
        await expect(sizeRadioButton).not.toBeChecked()
      }
    }
    for (const align of Object.values(ImageAlignOption)) {
      const alignRadioButton = this.nodeView.getByTestId(alignRadioTestId(align))
      if (align === expectedAlign) {
        await expect(alignRadioButton).toBeChecked()
      } else {
        await expect(alignRadioButton).not.toBeChecked()
      }
    }
  }
}
