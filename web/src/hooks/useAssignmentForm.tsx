import { ContentFormAction, ContentType, ContentTypeSingularEng, Exam, PublishState } from '../types'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { createAssignment, fetchData, updateAssignment } from '../request'
import { contentPagePath } from '../components/LudosRoutes'
import { DefaultValues, FieldPath, PathValue, useForm } from 'react-hook-form'
import {
  assignmentSchemaByExam,
  LdAssignmentFormType,
  PuhviAssignmentFormType,
  SukoAssignmentFormType
} from '../components/forms/schemas/assignmentSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../components/forms/formCommon/FormButtonRow'
import { useTranslation } from 'react-i18next'
import { MultiValue } from 'react-select'
import { LudosSelectOption } from '../components/ludosSelect/LudosSelect'

export function useAssignmentForm<T extends SukoAssignmentFormType | LdAssignmentFormType | PuhviAssignmentFormType>(
  exam: Exam,
  id: string | undefined
) {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setNotification } = useNotification()

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const action = id ? ContentFormAction.muokkaus : ContentFormAction.uusi
  const isUpdate = action === ContentFormAction.muokkaus

  const methods = useForm<T>({
    defaultValues:
      action === ContentFormAction.uusi
        ? ({ exam } as DefaultValues<T>)
        : async () => fetchData(`${ContentTypeSingularEng.koetehtavat}/${exam}/${id}`),
    mode: 'onBlur',
    resolver: zodResolver(assignmentSchemaByExam[exam])
  })

  const handleMultiselectOptionChange = (fieldName: FieldPath<T>, selectedOptions: MultiValue<LudosSelectOption>) => {
    methods.setValue(fieldName, selectedOptions.map((it) => it.value) as PathValue<T, FieldPath<T>>)
    methods.clearErrors(fieldName)
  }

  const submitAssignment = async (publishState: PublishState) => {
    await methods.handleSubmit(async (data: T) => {
      const body = { ...data, publishState }
      try {
        setIsLoading(true)
        let resultId: number
        if (isUpdate && id) {
          resultId = await updateAssignment<T>(Number(id), body)
        } else {
          resultId = await createAssignment<T>(body).then((res) => res.id)
        }
        setSubmitError('')

        if (publishState === PublishState.Draft) {
          setNotification({
            message: isUpdate
              ? t('form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
              : t('form.notification.tehtavan-tallennus.luonnos-onnistui'),
            type: NotificationEnum.success
          })
        }

        if (publishState === PublishState.Published) {
          setNotification({
            message: isUpdate
              ? t('form.notification.tehtavan-tallennus.onnistui')
              : t('form.notification.tehtavan-tallennus.julkaisu-onnistui'),
            type: NotificationEnum.success
          })
        }

        navigate(contentPagePath(exam, ContentType.koetehtavat, resultId), {
          state: { returnLocation: state?.returnLocation }
        })
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message || 'Unexpected error' : 'Unexpected error')
        setNotification({
          message: t('form.notification.tehtavan-tallennus.epaonnistui'),
          type: NotificationEnum.error
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const AssignmentFormButtonRow = ({ publishState }: { publishState?: PublishState }) => (
    <FormButtonRow
      actions={{
        onSubmitClick: () => submitAssignment(PublishState.Published),
        onSaveDraftClick: () => submitAssignment(PublishState.Draft)
      }}
      state={{
        isUpdate,
        isLoading,
        publishState
      }}
      formHasValidationErrors={Object.keys(methods.formState.errors).length > 0}
      errorMessage={submitError}
    />
  )

  return { methods, handleMultiselectOptionChange, AssignmentFormButtonRow }
}
