import { useState } from 'react'
import { NavigateOptions, useNavigate } from 'react-router-dom'
import { ContentType, Exam, NonDeletedPublishState, PublishState } from '../../types'
import { NotificationEnum, useNotification } from '../../contexts/NotificationContext'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { contentListPath, contentPagePath, uudelleenkirjautuminenOnnistuiPath } from '../LudosRoutes'
import { ExternalLink } from '../ExternalLink'
import { SessionExpiredFetchError } from '../../request'

export const useFormSubmission = (exam: Exam, contentType: ContentType, isUpdate: boolean) => {
  const { t, lt } = useLudosTranslation()
  const navigate = useNavigate()
  const { setNotification } = useNotification()

  const [submitError, setSubmitError] = useState<Error>()

  const notificationMessage = (error: Error, publishState: PublishState) => {
    if (publishState === PublishState.Deleted) {
      return lt.formDeleteErrorNotificationMessage[contentType]
    } else {
      if (error instanceof SessionExpiredFetchError) {
        return t('notification.error.istunto-vanhentunut')
      } else {
        return lt.formSubmitErrorNotificationMessage[contentType]
      }
    }
  }

  function setSuccessNotification(currentPublishState: NonDeletedPublishState, newPublishState: PublishState) {
    let message: string

    if (isUpdate) {
      message = lt.contentUpdateSuccessNotification[contentType][currentPublishState][newPublishState]
    } else if (newPublishState !== PublishState.Deleted) {
      message = lt.contentCreateSuccessNotification[contentType][newPublishState]
    } else {
      message = ''
    }

    setNotification({
      message: message,
      type: NotificationEnum.success
    })
  }

  function setErrorNotification(error: Error, publishState: PublishState) {
    setNotification({
      message: notificationMessage(error, publishState),
      type: NotificationEnum.error,
      linkComponent:
        error instanceof SessionExpiredFetchError ? (
          <ExternalLink
            className="underline"
            textColor="text-white"
            url={uudelleenkirjautuminenOnnistuiPath}
            data-testid="link">
            {t('notification.error.istunto-vanhentunut-uudelleenkirjautuminen-linkki')}
          </ExternalLink>
        ) : undefined
    })
  }

  function handleSuccess(
    publishState: PublishState,
    newPublishState: PublishState,
    resultId: number,
    state: NavigateOptions['state']
  ) {
    setSubmitError(undefined)
    // Jos ollaan muokkaamassa tai luomassa uutta, tiedetään että publishState on joko julkaistu tai luonnos
    const currentPublishState = publishState as NonDeletedPublishState

    setSuccessNotification(currentPublishState, newPublishState)

    if (newPublishState === PublishState.Deleted) {
      return navigate(contentListPath(exam, contentType), {
        replace: true // so that user cannot back navigate to edit deleted instruction
      })
    }

    navigate(contentPagePath(exam, contentType, resultId), { state })
  }

  function handleError(e: unknown, publishState: PublishState) {
    if (e instanceof SessionExpiredFetchError) {
      setSubmitError(e)
      setErrorNotification(e, publishState)
    } else if (e instanceof Error) {
      setErrorNotification(e, publishState)
    } else {
      throw Error('')
    }
  }

  async function submitFormData<T>(
    currentPublishState: PublishState,
    submitFunction: (data: T) => Promise<number>,
    data: T,
    newPublishState: PublishState,
    state: NavigateOptions['state']
  ) {
    try {
      const resultId = await submitFunction({ ...data, publishState: newPublishState })

      handleSuccess(currentPublishState, newPublishState, resultId, state)
    } catch (e) {
      handleError(e, currentPublishState)
    }
  }

  return {
    submitFormData,
    submitError
  }
}
