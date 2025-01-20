import { BrowserContext, Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { AssignmentIn, AssignmentOut, ContentType, Exam, PublishState } from 'web/src/types'
import { fetchWithSession, FormAction } from '../helpers'

interface TestedAssignmentIn extends AssignmentIn {
  assignmentTypeKoodiArvo?: string
  oppimaara?: { oppimaaraKoodiArvo: string }
  oppimaaraKielitarjontaKoodiArvo?: null
  lukuvuosiKoodiArvos?: string[]
  aiheKoodiArvos?: []
  aineKoodiArvo?: string
  tavoitetasoKoodiArvo?: null | []
}

export class AssignmentFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly createAssignmentButton = page.getByTestId('create-koetehtava-button'),
    readonly formErrorMsgOppimaara = page.getByTestId('error-message-oppimaara'),
    readonly formErrorMsgLukuvuosi = page.getByTestId('error-message-lukuvuosiKoodiArvos'),
    readonly contentSv = page.getByTestId('swedish-content')
  ) {
    super(page, exam)
  }

  async initializeTest() {
    await this.showKeys()
    await this.page.getByTestId(`nav-link-${this.exam.toLowerCase()}`).click()
    await this.createAssignmentButton.click()
  }

  async toggleItalics(editor: 'tehtavanOhje' | 'tehtavanSisalto') {
    if (editor === 'tehtavanOhje') {
      return await this.instructionFi.getByTestId('italic').click()
    } else if (editor === 'tehtavanSisalto') {
      return await this.page.getByTestId('contentFi-0').getByTestId('italic').click()
    }
    throw new Error('italics not found')
  }
  async fillTehtavanOhje(text: string) {
    await this.instructionFi.locator('div[contenteditable="true"]').fill(text)
  }

  testAssignmentIn(assignmentNameBase: string): TestedAssignmentIn {
    const base = {
      exam: this.exam,
      nameFi: `${assignmentNameBase} nimi fi`,
      nameSv: this.exam === Exam.SUKO ? '' : `${assignmentNameBase} nimi sv`,
      contentFi: [`${assignmentNameBase} sisältö fi`],
      contentSv: this.exam === Exam.SUKO ? [''] : [`${assignmentNameBase} sisältö sv`],
      instructionFi: `${assignmentNameBase} ohje fi`,
      instructionSv: this.exam === Exam.SUKO ? '' : `${assignmentNameBase} ohje sv`,
      publishState: PublishState.Published,
      laajaalainenOsaaminenKoodiArvos: [],
      contentType: ContentType.ASSIGNMENT
    }

    if (this.exam === Exam.SUKO) {
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
    } else if (this.exam === Exam.LD) {
      return {
        ...base,
        lukuvuosiKoodiArvos: ['20202021'],
        aineKoodiArvo: '1'
      }
    } else if (this.exam === Exam.PUHVI) {
      return {
        ...base,
        assignmentTypeKoodiArvo: '002',
        lukuvuosiKoodiArvos: ['20202021']
      }
    } else {
      throw new Error('Unknown exam')
    }
  }
  assignmentApiCalls(context: BrowserContext, baseURL: string) {
    return {
      create: (assignment: AssignmentIn) => this.createAssignmentApiCall(context, baseURL, assignment),
      update: (id: number, body: string) => this.updateAssignmentApiCall(context, baseURL, id, body)
    }
  }

  private async createAssignmentApiCall(
    context: BrowserContext,
    baseURL: string,
    assignment: AssignmentIn
  ): Promise<AssignmentOut> {
    const result = await fetchWithSession(context, `${baseURL}/api/assignment`, 'POST', JSON.stringify(assignment))

    if (!result.ok) {
      const errorText = await result.text()
      throw new Error(`Failed to create assignment: ${errorText}`)
    }

    return (await result.json()) as AssignmentOut
  }

  private async updateAssignmentApiCall(context: BrowserContext, baseURL: string, id: number, body: string) {
    return await fetchWithSession(context, `${baseURL}/api/assignment/${id}`, 'PUT', body)
  }

  async clickFormAction(action: FormAction) {
    await this.page.getByTestId(`form-${action}`).click()
  }

  async changeAssignmentPublishState(action: FormAction) {
    await this.page.getByTestId(`edit-content-btn`).click()
    await this.clickFormAction(action)
  }
}
