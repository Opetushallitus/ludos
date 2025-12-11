import { expect, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { PrintContentModel } from '../../models/PrintContentModel'
import { fillPuhviAssignmentForm } from '../../examHelpers/assignmentHelpers'

const laajaAlainenOsaaminen = {
  '05': { name: 'Eettisyys ja ympäristöosaaminen', code: '05' }
}

export const defaultPuhviFormData = {
  nameFi: 'Tehtava joka sisältää linkkejä ulkoisiin webbisivuihin',
  instructionFi: 'Lue huolellisesti tehtävän ohjeet',
  laajaalainenOsaaminenKoodiArvos: [laajaAlainenOsaaminen['05'].code],
  assignmentTypeKoodiArvo: '002',
  lukuvuosiKoodiArvos: ['20202021'],
  tehtavanSisalto: [{ text: 'koira', url: 'www.koira.com' }, { text: 'kissa', url: 'www.kissa.com' }]
}

export interface BasePuhviTestFixtures {
  formData: typeof defaultPuhviFormData
  newPuhviAssignment: AssignmentFormModel
  filledPuhviAssignment: AssignmentFormModel
  publishedPuhviAssignment: AssignmentContentModel
  puhviAssignmentPrintView: PrintContentModel
  printedPuhviAssignment: Buffer
  tehtavanSisalto: { text: string, url: string }
}

export const basePuhviTest = test.extend<BasePuhviTestFixtures>({
  formData: async ({}, use) => {
    await use(defaultPuhviFormData)
  },
  newPuhviAssignment: async ({ page }, use) => {
    const puhviPage = new AssignmentFormModel(page, Exam.PUHVI)
    await puhviPage.initializeTest()
    await use(puhviPage)
  },
  filledPuhviAssignment: async ({ newPuhviAssignment, formData, page }, use) => {
    await fillPuhviAssignmentForm(newPuhviAssignment, formData)

    async function createTiptapLinks(links: { text: string, url: string }[]) {
      await page.getByTestId(`contentFi-0`).locator('div[contenteditable="true"]').click()
      for (const link of links) {
        await page.getByTestId(`contentFi-0`).getByTestId('link').click()
        await page.getByTestId(`contentFi-0`).getByTestId('add-url-modal-input').fill(link.url)
        await page.getByTestId(`contentFi-0`).getByTestId('modal-button-add').click()
        await page.getByTestId(`contentFi-0`).locator('div[contenteditable="true"]').click()
        await page.getByTestId(`contentFi-0`).getByRole('textbox').pressSequentially(link.text)
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('Enter')
      }
    }

    await createTiptapLinks(formData.tehtavanSisalto)
    await use(newPuhviAssignment)
  },
  publishedPuhviAssignment: async ({ filledPuhviAssignment, formData }, use) => {
    await filledPuhviAssignment.submitButton.click()
    const content = new AssignmentContentModel(filledPuhviAssignment.page, Exam.SUKO)

    await expect(content.header).toHaveText(formData.nameFi)
    await expect(content.publishState).toHaveText('state.julkaistu')
    await use(content)
  },
  puhviAssignmentPrintView: async ({ publishedPuhviAssignment, formData }, use) => {
    const printView = await publishedPuhviAssignment.openPrintViewInNewWindow()
    await expect(printView.header).toHaveText(formData.nameFi)

    await use(printView)

    await publishedPuhviAssignment.page.bringToFront()
    await printView.page.close()
  },
  printedPuhviAssignment: async ({ puhviAssignmentPrintView }, use) => {
    const pdfBuffer = await puhviAssignmentPrintView.page.pdf()
    await use(pdfBuffer)
  }
})
