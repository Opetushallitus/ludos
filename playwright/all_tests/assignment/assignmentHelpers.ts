import { BrowserContext, expect, Page } from '@playwright/test'
import {
  postWithSession,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'
import { Exam, oppimaaraId, TeachingLanguage } from 'web/src/types'
import {
  CommonAssignmentFormType,
  LdAssignmentFormType,
  PuhviAssignmentFormType,
  SukoAssignmentFormType
} from 'web/src/components/forms/schemas/assignmentSchema'

export type AssignmentTextContent = Pick<
  CommonAssignmentFormType,
  'nameFi' | 'nameSv' | 'instructionFi' | 'instructionSv' | 'contentFi' | 'contentSv'
>

async function fillAssignmentTextFields(
  page: Page,
  exam: Exam,
  { nameFi, instructionFi, contentFi, nameSv, instructionSv, contentSv }: AssignmentTextContent
) {
  await page.getByTestId('nameFi').fill(nameFi)
  await page.getByTestId('instructionFi').fill(instructionFi)

  for (const [index, content] of contentFi.entries()) {
    await page.getByTestId(`contentFi-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== contentFi.length - 1) {
      await page.getByTestId('contentFi-add-content-field').click()
    }
  }

  if (exam === Exam.SUKO) {
    await expect(page.getByTestId('tab-sv')).toBeHidden()
    return
  }

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameSv)
  await page.getByTestId('instructionSv').fill(instructionSv)

  for (const [index, content] of contentSv.entries()) {
    await page.getByTestId(`contentSv-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== contentSv.length - 1) {
      await page.getByTestId('contentSv-add-content-field').click()
    }
  }
}

export async function fillSukoAssignmentForm(page: Page, formData: SukoAssignmentFormType) {
  await setSingleSelectDropdownOption(page, 'oppimaara', oppimaaraId(formData.oppimaara))
  await page.getByTestId(`assignmentTypeRadio-${formData.assignmentTypeKoodiArvo}`).click()
  if (formData.tavoitetasoKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'tavoitetaso', formData.tavoitetasoKoodiArvo)
  }
  await setMultiSelectDropdownOptions(page, 'aihe', formData.aiheKoodiArvos)
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminen', formData.laajaalainenOsaaminenKoodiArvos)

  await fillAssignmentTextFields(page, Exam.SUKO, formData)
}

export async function fillLdAssignmentForm(page: Page, formData: LdAssignmentFormType) {
  await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  await setSingleSelectDropdownOption(page, 'aineKoodiArvo', formData.aineKoodiArvo)
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', formData.laajaalainenOsaaminenKoodiArvos)
  await fillAssignmentTextFields(page, Exam.LD, formData)
}

export async function fillPuhviAssignmentForm(page: Page, formData: PuhviAssignmentFormType) {
  await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  await page.getByTestId(`assignmentTypeRadio-${formData.assignmentTypeKoodiArvo}`).click()
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', formData.laajaalainenOsaaminenKoodiArvos)
  await fillAssignmentTextFields(page, Exam.PUHVI, formData)
}

export async function assertSukoAssignmentContentView(page: Page, expectedFormData: SukoAssignmentFormType) {}

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
