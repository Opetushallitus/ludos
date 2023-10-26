import { ContentFormAction, ContentType, ContentTypeSingularEng, Exam, PublishState } from '../types'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { createAssignment, fetchData, updateAssignment } from '../request'
import { contentListPath, contentPagePath } from '../components/LudosRoutes'
import { DefaultValues, FieldPath, PathValue, useForm } from 'react-hook-form'
import { assignmentSchemaByExam, CommonAssignmentFormType } from '../components/forms/schemas/assignmentSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../components/forms/formCommon/FormButtonRow'
import { MultiValue } from 'react-select'
import { LudosSelectOption } from '../components/ludosSelect/LudosSelect'
import { DeleteModal } from '../components/modal/DeleteModal'
import { useLudosTranslation } from './useLudosTranslation'

export function useAssignmentForm<T extends CommonAssignmentFormType>(exam: Exam, id: string | undefined) {
  const { lt, t, i18n } = useLudosTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setNotification } = useNotification()

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  const action = id ? ContentFormAction.muokkaus : ContentFormAction.uusi
  const isUpdate = action === ContentFormAction.muokkaus

  const methods = useForm<T>({
    defaultValues: isUpdate
      ? async () => fetchData(`${ContentTypeSingularEng.koetehtavat}/${exam}/${id}`)
      : ({ exam } as DefaultValues<T>),
    mode: 'onBlur',
    resolver: zodResolver(assignmentSchemaByExam[exam])
  })

  const {
    getValues,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = methods

  const handleMultiselectOptionChange = (fieldName: FieldPath<T>, selectedOptions: MultiValue<LudosSelectOption>) => {
    setValue(fieldName, selectedOptions.map((it) => it.value) as PathValue<T, FieldPath<T>>)
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

    navigate(contentPagePath(exam, ContentType.koetehtavat, resultId), {
      state: { returnLocation: state?.returnLocation }
    })
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
        setIsLoading(true)
        const resultId = await submitAssignmentData(assignment)
        setSubmitError('')
        handleSuccess(publishState, resultId)
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message || 'Unexpected error' : 'Unexpected error')
        setErrorNotification(publishState)
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const AssignmentFormButtonRow = ({ publishState }: { publishState?: PublishState }) => (
    <>
      <FormButtonRow
        actions={{
          onSubmitClick: () => submitAssignment(PublishState.Published),
          onSaveDraftClick: () => submitAssignment(PublishState.Draft),
          onDeleteClick: () => setOpenDeleteModal(true)
        }}
        state={{
          isUpdate,
          isLoading,
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
              i18n.language === 'fi' ? getValues().nameFi : getValues().nameSv
            )}
          </p>
        </div>
      </DeleteModal>
    </>
  )

  return { methods, handleMultiselectOptionChange, AssignmentFormButtonRow }
}
