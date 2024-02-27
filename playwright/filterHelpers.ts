import { expect, Locator, Page } from '@playwright/test'
import { Exam } from 'web/src/types'
import { mapPromiseAll } from './helpers'

const getTextFromListItem = (listItem: Locator) => listItem.getByTestId('card-body').innerText()
const getTextBasedOnExam = mapPromiseAll(getTextFromListItem)

const getExpectedBodyTexts = (
  mappingFunction: { [key in Exam]: (number: number) => string },
  exam: Exam,
  numbers: number[]
): string[] => numbers.map(mappingFunction[exam])

export const checkListAfterFilteringWithProvidedContent =
  (bodyTextMapping: { [key in Exam]: (number: number) => string }) =>
  (page: Page, exam: Exam) =>
  async (expectedNumbersInCards: number[], contentSpecificAssert?: () => Promise<void>): Promise<void> => {
    await expect(page.getByTestId('card-list')).toBeVisible()

    const cards = await page.getByTestId('card-list').locator('li').all()
    const texts = await getTextBasedOnExam(cards)

    if (contentSpecificAssert) {
      await contentSpecificAssert()
    }

    const expectedTexts = getExpectedBodyTexts(bodyTextMapping, exam, expectedNumbersInCards)
    expect(texts).toEqual(expectedTexts)
  }
