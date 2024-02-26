import { expect, Page, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { checkListAfterFilteringWithProvidedContent } from '../../filterHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { CertificateContentListModel } from '../../models/CertificateContentListModel'

const bodyTextByExam = {
  [Exam.SUKO]: (number: number) => `SUKO Test Certificate Description ${number}`,
  [Exam.LD]: (number: number) => `LD Test Certificate ${number} FI`,
  [Exam.PUHVI]: (number: number) => `PUHVI Test Certificate ${number} FI`
}
const checkListAfterFilteringWithProvidedExam = checkListAfterFilteringWithProvidedContent(bodyTextByExam)

loginTestGroup(test, Role.YLLAPITAJA)
test.describe('Certificate filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seedCertificates')
  })

  const expectedNumbersInBodyTexts = Array.from({ length: 4 }, (_, i) => 3 - i)

  async function checkPdfDownloadIconWorks(page: Page, ids: number[], headless: boolean) {
    for (const id of ids) {
      const downloadBtn = page.getByTestId(`certificate-${id}`).getByTestId('download-pdf')

      // PDF reader headed/headless moodit toimii erilailla chromessa https://github.com/microsoft/playwright/issues/6342
      if (headless) {
        const [download] = await Promise.all([page.waitForEvent('download'), downloadBtn.click()])
        expect(download.suggestedFilename()).toBe('fixture1.pdf')
      } else {
        const [newTabPage] = await Promise.all([page.waitForEvent('popup'), downloadBtn.click()])
        await newTabPage.waitForLoadState('domcontentloaded')
        expect(newTabPage.url()).toContain('todistuspohja')
        await newTabPage.close()
      }
    }
  }

  Object.values(Exam).forEach((exam) => {
    test(`${exam} list`, async ({ page, headless }) => {
      const list = new CertificateContentListModel(page, exam)
      void list.goto()
      const content = await page
        .waitForResponse((response) => response.url().includes(`/api/certificate/${exam}`) && response.ok())
        .then((response) => response.json())

      const checkSukoList = checkListAfterFilteringWithProvidedExam(page, list.exam)

      await expect(list.createButton).toBeVisible()
      await list.setOrder('asc')

      await checkSukoList(
        expectedNumbersInBodyTexts.slice().reverse(),
        checkPdfDownloadIconWorks(
          page,
          content.content.map((c: any) => c.id),
          headless
        )
      )
      await list.setOrder('desc')
      await checkSukoList(
        expectedNumbersInBodyTexts,
        checkPdfDownloadIconWorks(
          page,
          content.content.map((c: any) => c.id),
          headless
        )
      )
    })
  })
})
