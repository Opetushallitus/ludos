import test, { expect } from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role } from '../../helpers'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { LayoutModel } from '../../models/LayoutModel'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe(`tehtavan ohje`, () => {
  test('can use italics', async ({ page }) => {
    await page.goto('/')
    await new LayoutModel(page).showLocalizationKeys()
    const form = new AssignmentFormModel(page, Exam.SUKO)
    await form.initializeTest()
    await expect(form.heading).toBeVisible()
    await form.toggleItalics('tehtavanOhje')
    await form.fillTehtavanOhje('kuinka vanhaksi koira voi elää?')
    expect(await form.instructionFi.screenshot()).toMatchSnapshot()
  })
})
