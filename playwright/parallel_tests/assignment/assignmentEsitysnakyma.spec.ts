import { expect, Locator, test } from '@playwright/test'
import { ContentType, ContentTypePluralFi, Exam } from 'web/src/types'
import { testEsitysNakyma } from '../../examHelpers/assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { BaseTestFixtures, baseTest, defaultSukoFormData } from '../fixtures/suko'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe.fixme('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const form = new AssignmentFormModel(page, Exam.SUKO)
    const content = new AssignmentContentModel(page, Exam.SUKO)
    const assignmentIn = form.testAssignmentIn('Esitysnäkymätesti')

    const assignment = await form.assignmentApiCalls(context, baseURL!).create(assignmentIn)
    await form.goToContentPage(ContentType.ASSIGNMENT, assignment.id)

    await expect(form.formHeader).toHaveText(assignmentIn.nameFi)
    await expect(content.metadata).toBeVisible()

    const esitysnakymaContentLocator = content.metadata.getByTestId('esitysnakyma')
    await testEsitysNakyma(page, esitysnakymaContentLocator, assignmentIn)

    const esitysnakymaCardLocator = page
      .getByTestId(`assignment-list-item-${assignment.id}`)
      .getByTestId('esitysnakyma')
    await page.goto(`/suko/${ContentTypePluralFi.ASSIGNMENT}`)
    await testEsitysNakyma(page, esitysnakymaCardLocator, assignmentIn)
  })
})

const printViewTest = baseTest.extend<BaseTestFixtures>({
  formData: async ({}, use) => {
    await use({
      ...defaultSukoFormData,
      nameFi: `Tulostusnäkymä: ${defaultSukoFormData.nameFi}`
    })
  }
})

printViewTest('Print view', async ({ sukoAssignmentPrintView, formData, printedSukoAssignment, browser }) => {
  await test.step('header has correct assignment name', async () => {
    await expect(sukoAssignmentPrintView.header).toHaveText(formData.nameFi)
  })
  await test.step('has correct metadata fields', async () => {
    await expect(sukoAssignmentPrintView.metadata).toBeVisible()
    await expect(sukoAssignmentPrintView.oppimaara).toContainText('saksan kieli')
    await expect(sukoAssignmentPrintView.tehtavatyyppi).toContainText('Kertominen')
    await expect(sukoAssignmentPrintView.laajaAlainenOsaaminen).toContainText('Eettisyys ja ympäristöosaaminen')
  })

  await test.step('has correct finnish instructions', async () => {
    await expect(sukoAssignmentPrintView.instructionFi).toContainText(formData.instructionFi)
  })

  await test.step('has correct finnish content', async () => {
    expect(await getNormalizedInnerTexts(sukoAssignmentPrintView.contentFi)).toContain(
      normalizeWhitespace(formData.contentFi[0])
    )
  })

  await test.step('has print button', async () => {
    await expect(sukoAssignmentPrintView.printButton).toBeVisible()
  })

  await test.step('printed PDF looks correct', async () => {
    const base64Pdf = printedSukoAssignment.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`
    const pdfPage = await browser.newPage()

    /* Embed base64 encoded PDF to an empty HTML page */
    await pdfPage.setContent(`
      <html lang="fi">
        <head><title>Print view</title></head>
        <body><object id="pdf-object" data="${dataUrl}" style="height:100%; width:100%;" /> </body>
      </html>`)
    await pdfPage.waitForLoadState('domcontentloaded')
    await pdfPage.bringToFront()
    await expect(pdfPage.locator('#pdf-object')).toBeVisible()

    const opts = { animations: 'disabled', maxDiffPixelRatio: 0.05 } as const
    await expect(async () => {
      await expect(pdfPage).toHaveScreenshot('printed-suko-assignment.png', opts)
    }).toPass()
    await pdfPage.close()
  })
})

async function getNormalizedInnerTexts(locator: Locator): Promise<string> {
  const text = (await locator.allInnerTexts()).join(' ')
  return normalizeWhitespace(text)
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ')
}
