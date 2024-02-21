import { useEffect, useState } from 'react'
import { useMatch } from 'react-router-dom'
import { ContentFormAction, ContentTypeSingularEng, Exam } from '../../../types'
import { fetchDataOrReload } from '../../../request'
import {
  AnyCertificateFormType,
  defaultValuesByExam,
  isLdCertificateValues,
  isPuhviCertificateValues,
  isSukoCertificateValues
} from '../schemas/certificateSchema'
import { Spinner } from '../../Spinner'
import { SukoCertificateForm } from './SukoCertificateForm'
import { LdCertificateForm } from './LdCertificateForm'
import { PuhviCertificateForm } from './PuhviCertificateForm'
import { InfoBox } from '../../InfoBox'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

type CertificateFormProps = {
  action: ContentFormAction
}

const CertificateFormPage = ({ action }: CertificateFormProps) => {
  const { t } = useLudosTranslation()
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)

  const [defaultValues, setDefaultValues] = useState<AnyCertificateFormType>()
  const [defaultValueError, setDefaultValueError] = useState<boolean>(false)

  const exam = match!.params.exam!.toUpperCase() as Exam
  const id = match!.params.id
  const isUpdate = action === ContentFormAction.muokkaus

  useEffect(() => {
    async function defaultValues() {
      if (isUpdate && id) {
        try {
          setDefaultValues(
            await fetchDataOrReload<AnyCertificateFormType>(`${ContentTypeSingularEng.todistukset}/${exam}/${id}`)
          )
        } catch (e) {
          setDefaultValueError(true)
          setDefaultValues(defaultValuesByExam[exam] as AnyCertificateFormType)
        }
      } else {
        setDefaultValues(defaultValuesByExam[exam] as AnyCertificateFormType)
      }
    }

    void defaultValues()
  }, [exam, id, isUpdate])

  if (!defaultValues) {
    return <Spinner />
  }

  if (defaultValueError) {
    return <InfoBox type="error" i18nKey={t('error.lataaminen-epaonnistui')} />
  }

  if (isSukoCertificateValues(defaultValues)) {
    return <SukoCertificateForm action={action} defaultValues={defaultValues} />
  } else if (isLdCertificateValues(defaultValues)) {
    return <LdCertificateForm action={action} defaultValues={defaultValues} />
  } else if (isPuhviCertificateValues(defaultValues)) {
    return <PuhviCertificateForm action={action} defaultValues={defaultValues} />
  }

  return <InfoBox type="error" i18nKey={t('error.lataaminen-epaonnistui')} />
}

export default CertificateFormPage
