import type { FeatureFlags } from '../types'
import { useFetch } from './useFetch'

export const useFeatureFlags = () => {
  const { data } = useFetch<FeatureFlags>(['featureFlags'], 'config/features')

  return {
    qrCodesForLinks: data?.qrCodesForLinks ?? false
  }
}
