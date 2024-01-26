import { expect, Page } from '@playwright/test'
import {
  FormAction,
  koodiLabel,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../helpers'
import { Exam, KoodistoName, Oppimaara, oppimaaraId, PublishState, TeachingLanguage } from 'web/src/types'
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

const createAssignmentFormDataByExam = {
  [Exam.SUKO]: {
    exam: Exam.SUKO,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä SUKO',
    nameSv: 'Testuppgift SUKO',
    instructionFi: 'Testiohje SUKO',
    instructionSv: 'Testinstruktioner SUKO',
    contentFi: ['Testisisältö SUKO'],
    contentSv: ['Testinnehåll SUKO'],
    laajaalainenOsaaminenKoodiArvos: ['01', '06', '02'],
    assignmentTypeKoodiArvo: '001',
    oppimaara: {
      oppimaaraKoodiArvo: 'VKA1',
      kielitarjontaKoodiArvo: null
    },
    tavoitetasoKoodiArvo: '0002',
    aiheKoodiArvos: ['001', '002']
  } as SukoAssignmentFormType,
  [Exam.LD]: {
    exam: Exam.LD,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä LD',
    nameSv: 'Testuppgift LD',
    instructionFi: 'Testiohjeet LD',
    instructionSv: 'Testinstruktioner LD',
    contentFi: ['Testisisältö LD 1', 'Testisisältö LD 2'],
    contentSv: ['Testinnehåll LD 1', 'Testinnehåll LD 2'],
    laajaalainenOsaaminenKoodiArvos: ['05'],
    lukuvuosiKoodiArvos: ['20202021'],
    aineKoodiArvo: '1'
  } as LdAssignmentFormType,
  [Exam.PUHVI]: {
    exam: Exam.PUHVI,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä PUHVI',
    nameSv: 'Testuppgift PUHVI',
    instructionFi: 'Testiohje PUHVI',
    instructionSv: 'Testinstruktioner PUHVI',
    contentFi: ['Testisisältö PUHVI'],
    contentSv: ['Testinnehåll PUHVI'],
    laajaalainenOsaaminenKoodiArvos: ['05'],
    lukuvuosiKoodiArvos: ['20202021'],
    assignmentTypeKoodiArvo: '002'
  } as PuhviAssignmentFormType
}

const updateAssignmentFormDataByExam = {
  [Exam.SUKO]: {
    ...createAssignmentFormDataByExam[Exam.SUKO],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.SUKO]),
    assignmentTypeKoodiArvo: '002',
    oppimaara: {
      oppimaaraKoodiArvo: 'VKA1',
      kielitarjontaKoodiArvo: 'SA'
    },
    tavoitetasoKoodiArvo: '0003',
    aiheKoodiArvos: ['003']
  } as SukoAssignmentFormType,
  [Exam.LD]: {
    ...createAssignmentFormDataByExam[Exam.LD],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.LD]),
    laajaalainenOsaaminenKoodiArvos: ['01', '02']
  } as LdAssignmentFormType,
  [Exam.PUHVI]: {
    ...createAssignmentFormDataByExam[Exam.PUHVI],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.PUHVI]),
    laajaalainenOsaaminenKoodiArvos: ['01', '02']
  } as PuhviAssignmentFormType
}

function appendMuokattuToTextFields(assignmentTextContent: AssignmentTextContent): AssignmentTextContent {
  return {
    nameFi: `${assignmentTextContent.nameFi} muokattu`,
    nameSv: `${assignmentTextContent.nameSv} updaterad`,
    instructionFi: `${assignmentTextContent.instructionFi} muokattu`,
    instructionSv: `${assignmentTextContent.instructionSv} updaterad`,
    contentFi: assignmentTextContent.contentFi.map((s) => `${s} muokattu`),
    contentSv: assignmentTextContent.contentSv.map((s) => `${s} updaterad`)
  }
}

export function formDataForCreate(exam: Exam, action: FormAction): AnyAssignmentFormType {
  const createFormData = createAssignmentFormDataByExam[exam]
  createFormData.publishState = action === 'submit' ? PublishState.Published : PublishState.Draft
  return createFormData as AnyAssignmentFormType
}

export function formDataForUpdate(exam: Exam, action: FormAction) {
  const updateFormData = updateAssignmentFormDataByExam[exam]
  updateFormData.publishState = action === 'submit' ? PublishState.Published : PublishState.Draft
  return updateFormData
}

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

export const filterTestAssignmentName = (number: number, teachingLanguage: TeachingLanguage, exam: Exam) =>
  `Filter test name ${number} ${teachingLanguage.toUpperCase()} ${exam}`

export async function testEsitysNakyma(page: Page, linkTestId: string, assignmentIn: any) {
  const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
  await page.getByTestId(linkTestId).click()
  const newTabPage = await newTabPagePromise

  await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
  await expect(newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
  await newTabPage.close()
}
