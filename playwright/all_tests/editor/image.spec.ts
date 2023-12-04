import test, { expect, Page } from '@playwright/test'
import {
  assertFailureNotification,
  assertSuccessNotification,
  createFilePathToFixtures,
  loginTestGroup,
  Role
} from '../../helpers'
import { Exam, ImageAlignOption, ImageSizeOption } from 'web/src/types'
import { InstructionFormData, instructionFormData } from '../instruction/instructionHelpers'
import { InstructionFormModel } from '../../models/InstructionFormModel'
import { LayoutModel } from '../../models/LayoutModel'
import { InstructionContentModel } from '../../models/InstructionContentModel'

type MinimalInstructionDataWithAltText = Pick<InstructionFormData, 'nameFi'> & { imageAltText: string }

const formData: MinimalInstructionDataWithAltText = {
  nameFi: instructionFormData.nameFi,
  imageAltText: 'Kuvassa on punainen laatikko'
}

export async function assertCreatedInstruction(page: Page) {
  const content = new InstructionContentModel(page)
  await expect(content.publishState).toHaveText('state.julkaistu')
  await expect(content.header).toHaveText(formData.nameFi)
  const image = content.contentFi.getByRole('img', { name: formData.imageAltText })
  await expect(image).toBeVisible()
  await expect(image).toHaveClass('tiptap-image-size-original tiptap-image-align-left')
}

async function createInstructionWithImage(form: InstructionFormModel, imageFilePath: string) {
  await expect(form.heading).toBeVisible()
  await form.fillMinimalInstructionForm()
  await form.contentFiEditor.uploadImage(imageFilePath, formData.imageAltText)

  const imageEditor = await form.contentFiEditor.imageEditorByAltText(formData.imageAltText)
  await imageEditor.assertImageOptions(ImageSizeOption.original, ImageAlignOption.left)

  await form.submitButton.click()

  await assertSuccessNotification(form.page, 'form.notification.ohjeen-tallennus.julkaisu-onnistui')
  await assertCreatedInstruction(form.page)
}

async function updateImageAttributes(form: InstructionFormModel) {
  const editedAltText = `${formData.imageAltText} muokattu`

  await new InstructionContentModel(form.page).editButton.click()
  ;(await form.contentFiEditor.imageEditorByAltText(formData.imageAltText)).altInput.fill(editedAltText)
  const imageEditor = await form.contentFiEditor.imageEditorByAltText(editedAltText)
  await imageEditor.selectImageSize(ImageSizeOption.small)
  await imageEditor.selectImageAlign(ImageAlignOption.center)
  await form.submitButton.click()

  const image = form.page.getByRole('img', { name: editedAltText })
  await expect(image).toHaveClass('tiptap-image-size-small tiptap-image-align-center')
}

loginTestGroup(test, Role.YLLAPITAJA)

test.describe(`Test image embedding in rich text editor`, () => {
  let form: InstructionFormModel

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await new LayoutModel(page).showLocalizationKeys()
    form = new InstructionFormModel(page, Exam.SUKO)
    await form.gotoNew()
  })

  test('can create instruction with image embedded and update its attributes', async () => {
    await createInstructionWithImage(form, createFilePathToFixtures('test-image.png'))
    await updateImageAttributes(form)
  })

  test('fail image upload gracefully', async () => {
    await expect(form.heading).toBeVisible()
    await form.fillMinimalInstructionForm()

    await form.contentFiEditor.imageFileInput.setInputFiles(createFilePathToFixtures('this-will-fail.png'))
    await assertFailureNotification(form.page, 'error.lataaminen-epaonnistui')
  })
})
