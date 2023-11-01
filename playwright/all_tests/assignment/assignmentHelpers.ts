import { BrowserContext, expect, Page } from '@playwright/test'
import {
  postWithSession,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'
import { Exam, TeachingLanguage } from 'web/src/types'

export type AssignmentTextContent = {
  nameTextFi: string
  nameTextSv: string
  instructionTextFi: string
  instructionTextSv: string
  contentTextFi: string[]
  contentTextSv: string[]
}

async function fillLukuvuosi(page: Page) {
  await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', ['20202021'])
}

export async function fillSukoAssignmentCreateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  await setSingleSelectDropdownOption(page, 'oppimaara', 'VKA1')
  await page.getByTestId('assignmentTypeRadio-001').click()
  await setSingleSelectDropdownOption(page, 'tavoitetaso', '0002')
  await setMultiSelectDropdownOptions(page, 'aihe', ['001', '002'])
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminen', ['01'])

  // Test searching for non-existing option
  await page.locator('#laajaalainenOsaaminen-input').fill('non-existing-option')

  const allAvailableLaajaalainenOptions = ['01', '02', '03', '04', '05', '06']

  for (const option of allAvailableLaajaalainenOptions) {
    await expect(page.getByTestId(`laajaalainenOsaaminen-option-${option}`)).toBeHidden()
  }

  // Test searching for existing option Globaali- ja kulttuurinen osaaminen, KoodiArvo: 06
  await page.locator('#laajaalainenOsaaminen-input').fill('globa')
  await page.getByTestId('laajaalainenOsaaminen-option-06').click()

  await page.getByTestId('laajaalainenOsaaminen-open').click()
  await page.getByTestId('laajaalainenOsaaminen-option-02').click()

  await fillAssignmentTextContent(page, Exam.SUKO, assignmentTextContent)
}

export async function fillSukoAssignmentUpdateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  await setSingleSelectDropdownOption(page, 'oppimaara', 'VKA1.SA')
  await page.getByTestId('assignmentTypeRadio-002').click()
  await setSingleSelectDropdownOption(page, 'tavoitetaso', '0003')
  // remove first selected option
  await page.getByTestId('aihe-remove-selected-option').first().click()
  // Verify that option has been removed
  const selectedOptionsAihe = await page.getByTestId('aihe-remove-selected-option').count()
  expect(selectedOptionsAihe).toBe(1)
  // remove all selected options
  await page.getByTestId('aihe-reset-selected-options').first().click()

  // Verify that all options have been removed
  const selectedOptionsAiheResetted = await page.getByTestId('selected-option-aihe').count()
  expect(selectedOptionsAiheResetted).toBe(0)

  await setSingleSelectDropdownOption(page, 'aihe', '003')

  await fillAssignmentTextContent(page, Exam.SUKO, assignmentTextContent)
}

async function fillAssignmentTextContent(
  page: Page,
  exam: Exam,
  { nameTextFi, instructionTextFi, contentTextFi, nameTextSv, instructionTextSv, contentTextSv }: AssignmentTextContent
) {
  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('instructionFi').fill(instructionTextFi)

  for (const [index, content] of contentTextFi.entries()) {
    await page.getByTestId(`contentFi-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== contentTextFi.length - 1) {
      await page.getByTestId('contentFi-add-content-field').click()
    }
  }

  if (exam === Exam.SUKO) {
    await expect(page.getByTestId('tab-sv')).toBeHidden()
    return
  }

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('instructionSv').fill(instructionTextSv)

  for (const [index, content] of contentTextSv.entries()) {
    await page.getByTestId(`contentSv-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== contentTextSv.length - 1) {
      await page.getByTestId('contentSv-add-content-field').click()
    }
  }
}

export async function fillLdAssignmentCreateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  // Kotitalous
  await setSingleSelectDropdownOption(page, 'aineKoodiArvo', '1')

  await fillLukuvuosi(page)

  await setLaajaalainenOsaaminenKoodiArvos(page, ['05']) // Eettisyys ja ympäristöosaaminen

  await fillAssignmentTextContent(page, Exam.LD, assignmentTextContent)
}

async function setLaajaalainenOsaaminenKoodiArvos(page: Page, koodiArvos: string[]) {
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', koodiArvos)
}

export async function fillLdAssignmentUpdateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  await setLaajaalainenOsaaminenKoodiArvos(page, ['01', '02']) // Hyvinvointiosaaminen, Vuorovaikutusosaaminen

  await fillAssignmentTextContent(page, Exam.LD, assignmentTextContent)
}

export async function fillPuhviAssignmentCreateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  // Esiintymistaidot
  await page.getByTestId('assignmentTypeRadio-002').click()
  await fillLukuvuosi(page)
  await setLaajaalainenOsaaminenKoodiArvos(page, ['05']) // Eettisyys ja ympäristöosaaminen

  await fillAssignmentTextContent(page, Exam.PUHVI, assignmentTextContent)
}

export async function fillPuhviAssignmentUpdateForm(page: Page, assignmentTextContent: AssignmentTextContent) {
  await setLaajaalainenOsaaminenKoodiArvos(page, ['01', '02']) // Hyvinvointiosaaminen, Vuorovaikutusosaaminen

  await fillAssignmentTextContent(page, Exam.PUHVI, assignmentTextContent)
}

export function testAssignmentIn(exam: Exam, assignmnentNameBase: string) {
  const base = {
    exam: exam,
    nameFi: `${assignmnentNameBase} nimi fi`,
    nameSv: `${assignmnentNameBase} nimi sv`,
    contentFi: [`${assignmnentNameBase} sisältö fi`],
    contentSv: [`${assignmnentNameBase} sisältö sv`],
    instructionFi: `${assignmnentNameBase} ohje fi`,
    instructionSv: `${assignmnentNameBase} ohje sv`,
    publishState: 'PUBLISHED',
    laajaalainenOsaaminenKoodiArvos: []
  }

  if (exam === Exam.SUKO) {
    return {
      ...base,
      assignmentTypeKoodiArvo: '003',
      oppimaara: {
        oppimaaraKoodiArvo: 'TKRUA1'
      },
      oppimaaraKielitarjontaKoodiArvo: null,
      tavoitetasoKoodiArvo: null,
      aiheKoodiArvos: []
    }
  } else if (exam === Exam.LD) {
    return {
      ...base,
      lukuvuosiKoodiArvos: ['20202021'],
      aineKoodiArvo: '1'
    }
  } else if (exam === Exam.PUHVI) {
    return {
      ...base,
      assignmentTypeKoodiArvo: '002',
      lukuvuosiKoodiArvos: ['20202021']
    }
  } else {
    throw new Error('Unknown exam')
  }
}

export async function createAssignment(context: BrowserContext, baseURL: string, assignment: any) {
  return (await postWithSession(context, `${baseURL}/api/assignment`, JSON.stringify(assignment))).json()
}

export const filterTestAssignmentName = (number: number, teachingLanguage: TeachingLanguage, exam: Exam) =>
  `Filter test name ${number} ${teachingLanguage.toUpperCase()} ${exam}`

export async function checkListAfterFiltering(page: Page, exam: Exam, expectedAssignmentTitleNumbers: number[]) {
  await expect(
    page.getByRole('link', {
      name: filterTestAssignmentName(expectedAssignmentTitleNumbers[0], TeachingLanguage.fi, exam)
    })
  ).toBeVisible()
  const assignments = await page.getByTestId('assignment-list').locator('li').all()
  const namePromises = assignments.map((listItem) => listItem.getByTestId('assignment-name-link').innerText())
  const names = await Promise.all(namePromises)
  expect(names).toEqual(
    expectedAssignmentTitleNumbers.map((number) => filterTestAssignmentName(number, TeachingLanguage.fi, exam))
  )
}

export async function assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
  page: Page,
  assignmentId: number,
  expectedNameSv: string
) {
  await page.getByTestId('return').click()
  const assignmentCard = page.getByTestId(`assignment-list-item-${assignmentId}`)
  await expect(assignmentCard).toBeVisible()

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(assignmentCard.getByTestId('assignment-name-link')).toHaveText(expectedNameSv)
}

export async function testEsitysNakyma(page: Page, linkTestId: string, assignmentIn: any) {
  const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
  await page.getByTestId(linkTestId).click()
  const newTabPage = await newTabPagePromise

  await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
  await expect(newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
  await newTabPage.close()
}
