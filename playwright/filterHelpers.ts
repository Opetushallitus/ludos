import { expect, Page } from '@playwright/test'
import { Exam } from 'web/src/types'

const getExpectedBodyTexts = (
  mappingFunction: { [key in Exam]: (number: number) => string },
  exam: Exam,
  numbers: number[]
): string[] => numbers.map(mappingFunction[exam])

export const checkListAfterFilteringWithProvidedContent =
  (bodyTextMapping: { [key in Exam]: (number: number) => string }) =>
  (page: Page, exam: Exam) =>
  async (expectedNumbersInCards: number[], contentSpecificAssert?: () => Promise<void>): Promise<void> => {
    await expect(page.locator('[role="status"]')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('card-list')).toBeVisible()

    const expectedTexts = getExpectedBodyTexts(bodyTextMapping, exam, expectedNumbersInCards)
    await expect(page.getByTestId('card-list').getByTestId('card-body')).toHaveText(expectedTexts)

    if (contentSpecificAssert) {
      await contentSpecificAssert()
    }
  }
