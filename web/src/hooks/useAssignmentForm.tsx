import { ContentFormAction, ContentType, ContentTypeSingularEng, Exam, PublishState } from '../types'
import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { createAssignment, fetchData, updateAssignment } from '../request'
import { contentListPath, contentPagePath } from '../components/LudosRoutes'
import { FieldPath, PathValue, useForm } from 'react-hook-form'
import {
  assignmentDefaultValuesByExam,
  assignmentSchemaByExam,
  CommonAssignmentFormType
} from '../components/forms/schemas/assignmentSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../components/forms/formCommon/FormButtonRow'
import { MultiValue } from 'react-select'
import { LudosSelectOption } from '../components/ludosSelect/LudosSelect'
import { DeleteModal } from '../components/modal/DeleteModal'
import { useLudosTranslation } from './useLudosTranslation'
import { LudosContext } from '../contexts/LudosContext'
import { useFormPrompt } from './useFormPrompt'

export function useAssignmentForm<T extends CommonAssignmentFormType>(exam: Exam, id: string | undefined) {
  const { lt, t } = useLudosTranslation()
  const { uiLanguage } = useContext(LudosContext)
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setNotification } = useNotification()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  const action = id ? ContentFormAction.muokkaus : ContentFormAction.uusi
  const isUpdate = action === ContentFormAction.muokkaus

  async function defaultValues<T>(): Promise<T> {
    if (isUpdate && id) {
      return await fetchData(`${ContentTypeSingularEng.koetehtavat}/${exam}/${id}`)
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

  useFormPrompt(isDirty)

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

  function setSuccessNotification(newPublishState: PublishState) {
    const currentState = getValues().publishState as typeof PublishState.Published | typeof PublishState.Draft

    setNotification({
      message: isUpdate
        ? lt.contentUpdateSuccessNotification[ContentType.koetehtavat][currentState][newPublishState]
        : lt.contentCreateSuccessNotification[ContentType.koetehtavat][
            newPublishState as typeof PublishState.Published | typeof PublishState.Draft
          ],
      type: NotificationEnum.success
    })
  }

  function handleSuccess(newPublishState: PublishState, resultId: number) {
    setSubmitError('')
    setSuccessNotification(newPublishState)

    if (newPublishState === PublishState.Deleted) {
      // do we have to account for when user comes from favorite list page?
      return navigate(contentListPath(exam, ContentType.koetehtavat), {
        replace: true // so that user cannot back navigate to edit deleted assignment
      })
    }

    navigate(contentPagePath(exam, ContentType.koetehtavat, resultId), { state })
  }

  function setErrorNotification(publishState: PublishState) {
    setNotification({
      message:
        publishState === PublishState.Deleted
          ? t('form.notification.tehtavan-poisto.epaonnistui')
          : t('form.notification.tehtavan-tallennus.epaonnistui'),
      type: NotificationEnum.error
    })
  }

  const submitAssignment = async (publishState: PublishState) => {
    await handleSubmit(async (data: T) => {
      const assignment = { ...data, publishState }

      try {
        setIsSubmitting(true)
        const resultId = await submitAssignmentData(assignment)
        setSubmitError('')
        handleSuccess(publishState, resultId)
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message || 'Unexpected error' : 'Unexpected error')
        setErrorNotification(publishState)
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const handleCancelClick = () => navigate(-1)

  const AssignmentFormButtonRow = ({ publishState }: { publishState?: PublishState }) => (
    <>
      <FormButtonRow
        actions={{
          onSubmitClick: () => submitAssignment(PublishState.Published),
          onSaveDraftClick: () => submitAssignment(PublishState.Draft),
          onDeleteClick: () => setOpenDeleteModal(true),
          onCancelClick: handleCancelClick
        }}
        state={{
          isUpdate,
          isSubmitting,
          publishState
        }}
        formHasValidationErrors={Object.keys(methods.formState.errors).length > 0}
        errorMessage={submitError}
      />
      <DeleteModal
        modalTitle={lt.contentDeleteModalTitle[ContentType.koetehtavat]}
        open={openDeleteModal}
        onDeleteAction={() => submitAssignment(PublishState.Deleted)}
        onClose={() => setOpenDeleteModal(false)}>
        <div className="h-[15vh] p-6">
          <p>
            {lt.contentDeleteModalText[ContentType.koetehtavat](
              uiLanguage === 'fi' ? getValues().nameFi : getValues().nameSv
            )}
          </p>
        </div>
      </DeleteModal>
    </>
  )

  return { methods, handleMultiselectOptionChange, AssignmentFormButtonRow, isSubmitting }
}
