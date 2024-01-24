import { ContentType, PublishState } from '../../types'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { DeleteModal } from '../modal/DeleteModal'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { UseFormReturn } from 'react-hook-form'
import { AnyAssignmentFormType } from './schemas/assignmentSchema'

type AssignmentFormButtonRowProps<T extends AnyAssignmentFormType> = {
  submitAssignment: (publishState: PublishState) => void
  submitError?: Error
  isUpdate: boolean
  methods: UseFormReturn<T>
  deleteModalState: {
    isDeleteModalOpen: boolean
    setIsDeleteModalOpen: (value: boolean) => void
  }
  publishState?: PublishState
}

export const AssignmentFormButtonRow = <T extends AnyAssignmentFormType>({
  submitAssignment,
  submitError,
  isUpdate,
  methods: {
    getValues,
    formState: { errors, isValid, isSubmitting }
  },
  deleteModalState: { isDeleteModalOpen, setIsDeleteModalOpen },
  publishState
}: AssignmentFormButtonRowProps<T>) => {
  const { lt } = useLudosTranslation()
  const navigate = useNavigate()
  const { uiLanguage } = useContext(LudosContext)

  return (
    <>
      <FormButtonRow
        actions={{
          onSubmitClick: () => submitAssignment(PublishState.Published),
          onSaveDraftClick: () => submitAssignment(PublishState.Draft),
          onDeleteClick: () => setIsDeleteModalOpen(true),
          onCancelClick: () => navigate(-1)
        }}
        state={{
          isUpdate,
          disableSubmit: isSubmitting || !isValid,
          publishState
        }}
        formHasValidationErrors={Object.keys(errors).length > 0}
        submitError={submitError}
      />
      <DeleteModal
        modalTitle={lt.contentDeleteModalTitle[ContentType.koetehtavat]}
        open={isDeleteModalOpen}
        onDeleteAction={() => submitAssignment(PublishState.Deleted)}
        onClose={() => setIsDeleteModalOpen(false)}>
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
}
