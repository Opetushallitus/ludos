import { BrowserContext, Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { Exam } from 'web/src/types'
import { fetchWithSession, FormAction } from '../helpers'

export class AssignmentFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly createAssignmentButton = page.getByTestId('create-koetehtava-button'),
    readonly formErrorMsgOppimaara = page.getByTestId('error-message-oppimaara'),
    readonly formErrorMsgLukuvuosi = page.getByTestId('error-message-lukuvuosiKoodiArvos')
  ) {
    super(page, exam)
  }

  async initializeTest() {
    await this.showKeys()
    await this.page.getByTestId(`nav-link-${this.exam.toLowerCase()}`).click()
    await this.createAssignmentButton.click()
  }

  testAssignmentIn(assignmentNameBase: string) {
    const base = {
      exam: this.exam,
      nameFi: `${assignmentNameBase} nimi fi`,
      nameSv: this.exam === Exam.SUKO ? '' : `${assignmentNameBase} nimi sv`,
      contentFi: [`${assignmentNameBase} sisältö fi`],
      contentSv: this.exam === Exam.SUKO ? [''] : [`${assignmentNameBase} sisältö sv`],
      instructionFi: `${assignmentNameBase} ohje fi`,
      instructionSv: this.exam === Exam.SUKO ? '' : `${assignmentNameBase} ohje sv`,
      publishState: 'PUBLISHED',
      laajaalainenOsaaminenKoodiArvos: []
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
      create: (assignment: any) => this.createAssignmentApiCall(context, baseURL, assignment),
      update: (id: string, body: string) => this.updateAssignmentApiCall(context, baseURL, id, body)
    }
  }

  private async createAssignmentApiCall(context: BrowserContext, baseURL: string, assignment: any) {
    return (await fetchWithSession(context, `${baseURL}/api/assignment`, 'POST', JSON.stringify(assignment))).json()
  }

  private async updateAssignmentApiCall(context: BrowserContext, baseURL: string, id: string, body: string) {
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
