import { BrowserContext, expect, Page } from '@playwright/test'
import {
  Exam,
  Language,
  postWithSession,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'

type AssignmentBase = {
  page: Page
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

export async function fillSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: AssignmentBase) {
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
  await page.getByTestId('laajaalainenOsaaminen-multi-select-ready-button').click()

  await page.getByTestId('laajaalainenOsaaminen-open').click()
  await page.getByTestId('laajaalainenOsaaminen-option-02').click()
  await page.getByTestId('laajaalainenOsaaminen-multi-select-ready-button').click()

  await fillAssignmentTextFields(
    page,
    Exam.Suko,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )
}

export async function updateSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: AssignmentBase) {
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
  await page.getByTestId('aihe-multi-select-ready-button').click()

  await fillAssignmentTextFields(
    page,
    Exam.Suko,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )
}

async function fillAssignmentTextFields(
  page: Page,
  exam: Exam,
  nameTextFi: string,
  instructionTextFi: string,
  contentTextFi: string[],
  nameTextSv: string,
  instructionTextSv: string,
  contentTextSv: string[]
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

  if (exam === Exam.Suko) {
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

export async function fillLdAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: AssignmentBase) {
  // Kotitalous
  await setSingleSelectDropdownOption(page, 'aineKoodiArvo', '1')

  await fillLukuvuosi(page)

  // Eettisyys ja ympäristöosaaminen
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', ['05'])

  await fillAssignmentTextFields(
    page,
    Exam.Ld,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )
}

async function fillLaajaalainenOsaaminenKoodiArvos(page: Page) {
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', ['02'])
}

export async function updateLdAssignment({
  page,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv,
  contentTextFi,
  contentTextSv
}: AssignmentBase) {
  await fillLaajaalainenOsaaminenKoodiArvos(page)

  await fillAssignmentTextFields(
    page,
    Exam.Ld,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )

  await page.getByTestId('form-update-submit').click()
  await expect(page.getByTestId('notification-success')).toBeVisible()
}

export async function fillPuhviAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: AssignmentBase) {
  // Esiintymistaidot
  await page.getByTestId('assignmentTypeRadio-002').click()
  await fillLukuvuosi(page)
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', ['05'])

  await fillAssignmentTextFields(
    page,
    Exam.Puhvi,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )
}

export async function updatePuhviAssignment({
  page,
  nameTextFi,
  nameTextSv,
  contentTextFi,
  contentTextSv,
  instructionTextFi,
  instructionTextSv
}: AssignmentBase) {
  await fillLaajaalainenOsaaminenKoodiArvos(page)

  await fillAssignmentTextFields(
    page,
    Exam.Puhvi,
    nameTextFi,
    instructionTextFi,
    contentTextFi,
    nameTextSv,
    instructionTextSv,
    contentTextSv
  )

  await page.getByTestId('form-update-submit').click()
  await expect(page.getByTestId('notification-success')).toBeVisible()
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

  if (exam === Exam.Suko) {
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
  } else if (exam === Exam.Ld) {
    return {
      ...base,
      lukuvuosiKoodiArvos: ['20202021'],
      aineKoodiArvo: '1'
    }
  } else if (exam === Exam.Puhvi) {
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

export const filterTestAssignmentName = (number: number, language: Language, exam: Exam) =>
  `Filter test name ${number} ${language} ${exam}`

export async function checkListAfterFiltering(page: Page, expectedAssignmentTitleNumbers: number[], exam: Exam) {
  await expect(
    page.getByRole('link', { name: filterTestAssignmentName(expectedAssignmentTitleNumbers[0], Language.FI, exam) })
  ).toBeVisible()
  const assignments = await page.getByTestId('assignment-list').locator('li').all()
  const namePromises = assignments.map((listItem) => listItem.getByTestId('assignment-name-link').innerText())
  const names = await Promise.all(namePromises)
  expect(names).toEqual(
    expectedAssignmentTitleNumbers.map((number) => filterTestAssignmentName(number, Language.FI, exam))
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

  await setTeachingLanguage(page, Language.SV)

  await expect(assignmentCard.getByTestId('assignment-name-link')).toHaveText(expectedNameSv)
}
