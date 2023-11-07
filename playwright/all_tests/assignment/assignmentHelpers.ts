import { BrowserContext, expect, Page } from '@playwright/test'
import {
  koodiNimi,
  postWithSession,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'
import { Exam, KoodistoName, Oppimaara, oppimaaraId, TeachingLanguage } from 'web/src/types'
import {
  AnyAssignmentFormType,
  CommonAssignmentFormType,
  isLdAssignmentFormType,
  isPuhviAssignmentFormType,
  isSukoAssignmentFormType,
  LdAssignmentFormType,
  PuhviAssignmentFormType,
  SukoAssignmentFormType
} from 'web/src/components/forms/schemas/assignmentSchema'
import { preventLineBreaksFromHyphen } from 'web/src/utils/formatUtils'

export type AssignmentTextContent = Pick<
  CommonAssignmentFormType,
  'nameFi' | 'nameSv' | 'instructionFi' | 'instructionSv' | 'contentFi' | 'contentSv'
>

async function fillCommonAssignmentFields(page: Page, exam: Exam, formData: AnyAssignmentFormType) {
  await setMultiSelectDropdownOptions(page, 'laajaalainenOsaaminenKoodiArvos', formData.laajaalainenOsaaminenKoodiArvos)

  await page.getByTestId('nameFi').fill(formData.nameFi)
  await page.getByTestId('instructionFi').fill(formData.instructionFi)

  for (const [index, content] of formData.contentFi.entries()) {
    await page.getByTestId(`contentFi-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== formData.contentFi.length - 1) {
      await page.getByTestId('contentFi-add-content-field').click()
    }
  }

  if (exam === Exam.SUKO) {
    await expect(page.getByTestId('tab-sv')).toBeHidden()
    return
  }

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(formData.nameSv)
  await page.getByTestId('instructionSv').fill(formData.instructionSv)

  for (const [index, content] of formData.contentSv.entries()) {
    await page.getByTestId(`contentSv-${index}`).locator('div[contenteditable="true"]').fill(content)
    // if not last content press add content field button
    if (index !== formData.contentSv.length - 1) {
      await page.getByTestId('contentSv-add-content-field').click()
    }
  }
}

export async function fillAssignmentForm(page: Page, formData: AnyAssignmentFormType) {
  if (isSukoAssignmentFormType(formData)) {
    await fillSukoAssignmentForm(page, formData)
  } else if (isLdAssignmentFormType(formData)) {
    await fillLdAssignmentForm(page, formData)
  } else if (isPuhviAssignmentFormType(formData)) {
    await fillPuhviAssignmentForm(page, formData)
  } else {
    throw new Error(`Unknown form type: ${formData}`)
  }
}

export async function fillSukoAssignmentForm(page: Page, formData: SukoAssignmentFormType) {
  await setSingleSelectDropdownOption(page, 'oppimaara', oppimaaraId(formData.oppimaara))
  await page.getByTestId(`assignmentTypeRadio-${formData.assignmentTypeKoodiArvo}`).click()
  if (formData.tavoitetasoKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'tavoitetaso', formData.tavoitetasoKoodiArvo)
  }
  await setMultiSelectDropdownOptions(page, 'aihe', formData.aiheKoodiArvos)

  await fillCommonAssignmentFields(page, Exam.SUKO, formData)
}

export async function fillLdAssignmentForm(page: Page, formData: LdAssignmentFormType) {
  await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  await setSingleSelectDropdownOption(page, 'aineKoodiArvo', formData.aineKoodiArvo)
  await fillCommonAssignmentFields(page, Exam.LD, formData)
}

export async function fillPuhviAssignmentForm(page: Page, formData: PuhviAssignmentFormType) {
  await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  await page.getByTestId(`assignmentTypeRadio-${formData.assignmentTypeKoodiArvo}`).click()
  await fillCommonAssignmentFields(page, Exam.PUHVI, formData)
}

async function oppimaaraLabel(oppimaara: Oppimaara) {
  const oppimaaraKoodiArvoLabel = await koodiLabel(
    KoodistoName.OPPIAINEET_JA_OPPIMAARAT_LOPS2021,
    oppimaara.oppimaaraKoodiArvo
  )
  const kielitarjontaKoodiArvoLabel = oppimaara.kielitarjontaKoodiArvo
    ? await koodiLabel(KoodistoName.KIELITARJONTA, oppimaara.kielitarjontaKoodiArvo)
    : null
  if (oppimaara.kielitarjontaKoodiArvo) {
    return preventLineBreaksFromHyphen(`${oppimaaraKoodiArvoLabel}, ${kielitarjontaKoodiArvoLabel}`)
  } else {
    return preventLineBreaksFromHyphen(oppimaaraKoodiArvoLabel)
  }
}

async function koodiLabel(koodistoName: KoodistoName, koodiArvos: string | string[]): Promise<string> {
  if (typeof koodiArvos === 'string') {
    return koodiNimi(koodistoName, koodiArvos)
  } else {
    const labels = await Promise.all(koodiArvos.map((ka) => koodiLabel(koodistoName, ka)))
    return labels.sort().join(', ')
  }
}

export async function contentIdFromContentPage(page: Page): Promise<number> {
  await expect(page.getByTestId('content-common')).toBeVisible()
  const idString = page.url().split('/').pop()
  if (idString && /^\d+$/.test(idString)) {
    return parseInt(idString)
  } else {
    throw new Error(`Unable to parse id from url ${page.url()}`)
  }
}

export async function assertAssignmentContentPage(page: Page, formData: AnyAssignmentFormType) {
  if (isSukoAssignmentFormType(formData)) {
    await assertSukoAssignmentContentPage(page, formData)
  } else if (isLdAssignmentFormType(formData)) {
    await assertLdAssignmentContentPage(page, formData)
  } else if (isPuhviAssignmentFormType(formData)) {
    await assertPuhviAssignmentContentPage(page, formData)
  } else {
    throw new Error(`Unknown form type: ${formData}`)
  }
}

async function assertCommonAssignmentContentPage(page: Page, expectedFormData: CommonAssignmentFormType) {
  await expect(page.getByTestId('publish-state')).toHaveText(
    expectedFormData.publishState === 'PUBLISHED' ? 'state.julkaistu' : 'state.luonnos'
  )
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
    await koodiLabel(KoodistoName.LAAJA_ALAINEN_OSAAMINEN_LOPS2021, expectedFormData.laajaalainenOsaaminenKoodiArvos)
  )

  await expect(page.getByTestId('assignment-header')).toHaveText(expectedFormData.nameFi)
  await expect(page.getByTestId('instruction-fi')).toHaveText(expectedFormData.instructionFi)
  for (const [i, content] of expectedFormData.contentFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  if (expectedFormData.exam !== Exam.SUKO) {
    await setTeachingLanguage(page, TeachingLanguage.sv)

    await expect(page.getByTestId('assignment-header')).toHaveText(expectedFormData.nameSv)
    await expect(page.getByTestId('instruction-sv')).toHaveText(expectedFormData.instructionSv)
    for (const [i, content] of expectedFormData.contentSv.entries()) {
      await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
    }

    await setTeachingLanguage(page, TeachingLanguage.fi)
  }
}
export async function assertSukoAssignmentContentPage(page: Page, expectedFormData: SukoAssignmentFormType) {
  await assertCommonAssignmentContentPage(page, expectedFormData)

  await expect(page.getByTestId('suko-oppimaara')).toHaveText(await oppimaaraLabel(expectedFormData.oppimaara))
  await expect(page.getByTestId('suko-tehtavatyyppi')).toHaveText(
    await koodiLabel(KoodistoName.TEHTAVATYYPPI_SUKO, expectedFormData.assignmentTypeKoodiArvo)
  )
  // await expect(page.getByTestId('suko-tavoitetaso')).toBeVisible()
  await expect(page.getByTestId('suko-aihe')).toHaveText(
    await koodiLabel(KoodistoName.AIHE_SUKO, expectedFormData.aiheKoodiArvos)
  )
}

export async function assertLdAssignmentContentPage(page: Page, expectedFormData: LdAssignmentFormType) {
  await assertCommonAssignmentContentPage(page, expectedFormData)

  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText(
    await koodiLabel(KoodistoName.LUDOS_LUKUVUOSI, expectedFormData.lukuvuosiKoodiArvos)
  )
  await expect(page.getByTestId('ld-aine')).toHaveText(
    await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, expectedFormData.aineKoodiArvo)
  )
}

export async function assertPuhviAssignmentContentPage(page: Page, expectedFormData: PuhviAssignmentFormType) {
  await assertCommonAssignmentContentPage(page, expectedFormData)

  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText(
    await koodiLabel(KoodistoName.LUDOS_LUKUVUOSI, expectedFormData.lukuvuosiKoodiArvos)
  )
  await expect(page.getByTestId('puhvi-tehtavatyyppi')).toHaveText(
    await koodiLabel(KoodistoName.TEHTAVATYYPPI_PUHVI, expectedFormData.assignmentTypeKoodiArvo)
  )
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

export async function testEsitysNakyma(page: Page, linkTestId: string, assignmentIn: any) {
  const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
  await page.getByTestId(linkTestId).click()
  const newTabPage = await newTabPagePromise

  await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
  await expect(newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
  await newTabPage.close()
}
