import { expect, Locator, Page } from '@playwright/test'
import {
  FormAction,
  koodiLabel,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../helpers'
import { AssignmentIn, Exam, KoodistoName, Language, Oppimaara, oppimaaraId, PublishState } from 'web/src/types'
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
import { AssignmentFormModel } from '../models/AssignmentFormModel'

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
    contentFi: assignmentTextContent.contentFi?.map((s) => `${s} muokattu`),
    contentSv: assignmentTextContent.contentSv?.map((s) => `${s} updaterad`)
  }
}

export function createFormData(exam: Exam, action: FormAction, isUpdate: boolean = false): AnyAssignmentFormType {
  const data = isUpdate ? updateAssignmentFormDataByExam[exam] : createAssignmentFormDataByExam[exam]
  return { ...data, publishState: action === 'submit' ? PublishState.Published : PublishState.Draft }
}

async function fillCommonAssignmentFields(form: AssignmentFormModel, formData: Partial<AnyAssignmentFormType>) {
  if (formData.laajaalainenOsaaminenKoodiArvos) {
    await setMultiSelectDropdownOptions(
      form.page,
      'laajaalainenOsaaminenKoodiArvos',
      formData.laajaalainenOsaaminenKoodiArvos
    )
  }

  if (formData.nameFi) {
    await form.nameFi.fill(formData.nameFi)
  }

  if (formData.instructionFi) {
    await form.instructionFi.locator('div[contenteditable="true"]').fill(formData.instructionFi)
  }

  if (formData.contentFi) {
    for (const [index, content] of formData.contentFi.entries()) {
      await form.page.getByTestId(`contentFi-${index}`).locator('div[contenteditable="true"]').fill(content)

      // if not last content press add content field button
      if (index !== formData.contentFi.length - 1) {
        await form.page.getByTestId('contentFi-add-content-field').click()
      }
    }
  }

  if (form.exam === Exam.SUKO) {
    await expect(form.tabSv).toBeHidden()
  } else {
    if (formData.nameSv) {
      await form.tabSv.click()
      await form.nameSv.fill(formData.nameSv)
    }

    if (formData.instructionSv) {
      await form.instructionSv.locator('div[contenteditable="true"]').fill(formData.instructionSv)
    }

    if (formData.contentSv) {
      for (const [index, content] of formData.contentSv.entries()) {
        await form.page.getByTestId(`contentSv-${index}`).locator('div[contenteditable="true"]').fill(content)
        // if not last content press add content field button
        if (index !== formData.contentSv.length - 1) {
          await form.page.getByTestId('contentSv-add-content-field').click()
        }
      }
    }
  }
}

export async function fillAssignmentForm(form: AssignmentFormModel, formData: AnyAssignmentFormType) {
  if (isSukoAssignmentFormType(formData)) {
    await fillSukoAssignmentForm(form, formData)
  } else if (isLdAssignmentFormType(formData)) {
    await fillLdAssignmentForm(form, formData)
  } else if (isPuhviAssignmentFormType(formData)) {
    await fillPuhviAssignmentForm(form, formData)
  } else {
    throw new Error(`Unknown form type: ${formData}`) // eslint-disable-line @typescript-eslint/restrict-template-expressions
  }
}

export async function fillAssignmentType(
  page: Page,
  formData: Partial<SukoAssignmentFormType | PuhviAssignmentFormType>
) {
  if (formData.assignmentTypeKoodiArvo) {
    await page.getByTestId(`assignmentTypeRadio-${formData.assignmentTypeKoodiArvo}`).click()
  }
}

export async function fillSukoAssignmentForm(form: AssignmentFormModel, formData: Partial<SukoAssignmentFormType>) {
  const page = form.page

  if (formData.oppimaara) {
    await setSingleSelectDropdownOption(page, 'oppimaara', oppimaaraId(formData.oppimaara))
  }

  await fillAssignmentType(page, formData)

  if (formData.tavoitetasoKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'tavoitetaso', formData.tavoitetasoKoodiArvo)
  }

  if (formData.aiheKoodiArvos) {
    await setMultiSelectDropdownOptions(page, 'aihe', formData.aiheKoodiArvos)
  }

  await fillCommonAssignmentFields(form, formData)
}

export async function fillLdAssignmentForm(form: AssignmentFormModel, formData: Partial<LdAssignmentFormType>) {
  const page = form.page

  if (formData.lukuvuosiKoodiArvos) {
    await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  }

  if (formData.aineKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'aineKoodiArvo', formData.aineKoodiArvo)
  }

  await fillCommonAssignmentFields(form, formData)
}

export async function fillPuhviAssignmentForm(form: AssignmentFormModel, formData: Partial<PuhviAssignmentFormType>) {
  const page = form.page

  if (formData.lukuvuosiKoodiArvos) {
    await setMultiSelectDropdownOptions(page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
  }

  await fillAssignmentType(page, formData)
  await fillCommonAssignmentFields(form, formData)
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
    throw new Error(`Unknown form type: ${formData}`) // eslint-disable-line @typescript-eslint/restrict-template-expressions
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
  await expect(page.getByTestId('editor-instruction-FI-0')).toHaveText(expectedFormData.instructionFi)
  await expect(page.getByTestId('return')).toHaveText('assignment.palaa')

  if (expectedFormData.contentFi) {
    for (const [i, content] of expectedFormData.contentFi.entries()) {
      await expect(page.getByTestId(`editor-content-FI-${i}`)).toHaveText(content)
    }
  }

  if (expectedFormData.exam !== Exam.SUKO) {
    await setTeachingLanguage(page, Language.SV)

    await expect(page.getByTestId('assignment-header')).toHaveText(expectedFormData.nameSv)
    await expect(page.getByTestId('editor-instruction-SV-0')).toHaveText(expectedFormData.instructionSv)

    if (expectedFormData.contentSv) {
      for (const [i, content] of expectedFormData.contentSv.entries()) {
        await expect(page.getByTestId(`editor-content-SV-${i}`)).toHaveText(content)
      }
    }

    await setTeachingLanguage(page, Language.FI)
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

export const filterTestAssignmentName = (number: number, teachingLanguage: Language, exam: Exam) =>
  `Filter test name ${number} ${teachingLanguage.toUpperCase()} ${exam}`

export async function testEsitysNakyma(page: Page, linkTestId: Locator, assignmentIn: AssignmentIn) {
  const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
  await linkTestId.click()
  const newTabPage = await newTabPagePromise

  await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
  await expect(newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
  await newTabPage.close()
}
