import { BrowserContext, expect, Page, test } from '@playwright/test'
import { createAssignment, testAssignmentIn, testEsitysNakyma } from './assignmentHelpers'
import { assertSuccessNotification, loginTestGroup, Role } from '../../helpers'
import { ContentType, Exam } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

const favoritesCount = async (page: Page): Promise<number> => {
  await expect
    .poll(async () => await page.getByTestId('header-favorites-count').innerText(), {
      message: `wait for current favorite count`
    })
    .toMatch(/^\d+$/)
  return Number(await page.getByTestId('header-favorites-count').innerText())
}

test.describe('Assignment favorites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('header-language-dropdown-expand').click()
    await page.getByText('Näytä avaimet').click()
  })
  async function prepAssignmentGoToAssignmentList(
    page: Page,
    exam: Exam,
    context: BrowserContext,
    baseURL: string
  ): Promise<[any, number]> {
    const assignmentIn = testAssignmentIn(exam, 'Suosikkitesti')
    const assignment = await createAssignment(context, baseURL, assignmentIn)

    await page.goto(`/${exam.toLowerCase()}/${ContentType.koetehtavat}`)
    await page.getByTestId('card-list').locator('li').isVisible()

    const favoriteCountBefore = await favoritesCount(page)

    return [assignment, favoriteCountBefore]
  }

  async function assertFavoritesPage(page: Page, exam: Exam, assignment: any, favoriteCountBefore: number) {
    await page.getByTestId('header-favorites').click()
    await page.getByTestId(`tab-${exam.toLowerCase()}`).click()
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeVisible()
    await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('card-title').click()
    await expect(page.getByTestId('assignment-header')).toHaveText(assignment.nameFi)
    await page.goBack()
    await testEsitysNakyma(page, `assignment-${assignment.id}-action-esitysnakyma`, assignment)
    await page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
    await assertSuccessNotification(page, 'assignment.notification.suosikki-poistettu')
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeHidden()

    await assertFavoriteCountIsEventually(page, favoriteCountBefore)
  }

  async function assertFavoriteCountIsEventually(page: Page, expectedCount: number) {
    await expect
      .poll(async () => await favoritesCount(page), {
        message: `make sure favorite count eventually updates to ${expectedCount}`
      })
      .toBe(expectedCount)
  }

  async function testSettingAndUnsettingAsFavorite(
    page: Page,
    assignment: any,
    favoriteCountBefore: number,
    exam: 'SUKO' | 'LD' | 'PUHVI'
  ) {
    const favoriteButtonLocator = page.getByTestId(`assignment-${assignment.id}-suosikki`)
    await expect(favoriteButtonLocator.locator('span')).toHaveText('favorite.lisaa-suosikiksi')
    await favoriteButtonLocator.click()
    await assertSuccessNotification(page, 'assignment.notification.suosikki-lisatty')
    await expect(favoriteButtonLocator.locator('span')).toHaveText('favorite.poista-suosikeista')
    await assertFavoriteCountIsEventually(page, favoriteCountBefore + 1)

    await assertFavoritesPage(page, exam, assignment, favoriteCountBefore)
  }

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from list`, async ({ page, context, baseURL }) => {
      const [assignment, favoriteCountBefore] = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)
      await testSettingAndUnsettingAsFavorite(page, assignment, favoriteCountBefore, exam)
    })
  })

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from assignment content page`, async ({ page, context, baseURL }) => {
      const [assignment, favoriteCountBefore] = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)
      await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('card-title').click()
      await expect(page.getByTestId('assignment-header')).toBeVisible()
      await testSettingAndUnsettingAsFavorite(page, assignment, favoriteCountBefore, exam)
    })
  })
})
