import { useFetch } from './useFetch'
import { FeatureFlags } from '../types'

export const useFeatureFlags = () => {
  const { data } = useFetch<FeatureFlags>(['featureFlags'], 'config/features')

  return {
    qrCodesForLinks: data?.qrCodesForLinks ?? false
  }
}
