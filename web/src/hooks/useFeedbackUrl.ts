import { useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { FEEDBACK_BASE_URL } from '../constants'
import { LudosContext } from '../contexts/LudosContext'

export const useFeedbackUrl = (errorMessage?: string) => {
  const { uiLanguage } = useContext(LudosContext)
  const { pathname, search, hash } = useLocation()

  const feedbackParams = new URLSearchParams({
    ref: `${window.location.origin}${pathname}${search}${hash}${errorMessage ? `&virhe='${errorMessage}'` : ''}`,
    language: uiLanguage.toLowerCase()
  })

  return `${FEEDBACK_BASE_URL}?${feedbackParams.toString()}`
}
