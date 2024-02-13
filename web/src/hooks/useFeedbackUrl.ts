import { useContext } from 'react'
import { LudosContext } from '../contexts/LudosContext'
import { FEEDBACK_BASE_URL } from '../constants'
import { useLocation } from 'react-router-dom'

export const useFeedbackUrl = () => {
  const { uiLanguage } = useContext(LudosContext)
  const { pathname, search, hash } = useLocation()

  const feedbackParams = new URLSearchParams({
    ref: `${window.location.origin}${pathname}${search}${hash}`,
    language: uiLanguage
  })

  return `${FEEDBACK_BASE_URL}?${feedbackParams.toString()}`
}
