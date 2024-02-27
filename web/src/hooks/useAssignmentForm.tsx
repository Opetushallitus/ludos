import { ContentFormAction, ContentType, ContentTypeSingularEn, Exam, PublishState } from '../types'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { createAssignment, fetchDataOrReload, updateAssignment } from '../request'
import { FieldPath, PathValue, useForm } from 'react-hook-form'
import {
  assignmentDefaultValuesByExam,
  assignmentSchemaByExam,
  CommonAssignmentFormType
} from '../components/forms/schemas/assignmentSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { MultiValue } from 'react-select'
import { LudosSelectOption } from '../components/ludosSelect/LudosSelect'
import { useFormSubmission } from './useFormSubmission'
import { useBlockFormCloseOrRefresh } from './useBlockFormCloseOrRefresh'

export function useAssignmentForm<T extends CommonAssignmentFormType>(
  exam: Exam,
  id: string | undefined,
  action: ContentFormAction
) {
  const { state } = useLocation()
  const [defaultValueError, setDefaultValueError] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const isUpdate = action === ContentFormAction.muokkaus

  const { submitFormData, submitError } = useFormSubmission(exam, ContentType.ASSIGNMENT, isUpdate)

  async function defaultValues<T>(): Promise<T> {
    if (isUpdate && id) {
      try {
        return await fetchDataOrReload(`${ContentTypeSingularEn.ASSIGNMENT}/${exam}/${id}`)
      } catch (e) {
        setDefaultValueError(true)
        return assignmentDefaultValuesByExam[exam] as T
      }
    } else {
      return assignmentDefaultValuesByExam[exam] as T
    }
  }

  const methods = useForm<T>({
    defaultValues,
    mode: 'onBlur',
    resolver: zodResolver(assignmentSchemaByExam[exam])
  })

  const {
    getValues,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { isDirty }
  } = methods

  useBlockFormCloseOrRefresh(isDirty)

  const handleMultiselectOptionChange = (fieldName: FieldPath<T>, selectedOptions: MultiValue<LudosSelectOption>) => {
    setValue(fieldName, selectedOptions.map((it) => it.value) as PathValue<T, FieldPath<T>>, { shouldDirty: true })
    clearErrors(fieldName)
  }

  async function submitAssignmentData(assignment: T) {
    if (action === ContentFormAction.muokkaus && id) {
      return await updateAssignment<T>(Number(id), assignment)
    } else {
      return await createAssignment<T>(assignment).then((res) => res.id)
    }
  }

  const submitAssignment = async (newPublishState: PublishState) => {
    await handleSubmit(
      async (data: T) =>
        await submitFormData<T>(getValues().publishState!, submitAssignmentData, data, newPublishState, state)
    )()
  }

  return {
    methods,
    handleMultiselectOptionChange,
    submitAssignment,
    submitError,
    defaultValueError,
    isDeleteModalOpen,
    setIsDeleteModalOpen
  }
}
