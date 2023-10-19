import { useFetch } from '../../../../hooks/useFetch'
import {
  CertificateDtoOut,
  ContentOut,
  ContentType,
  ContentTypeSingular,
  ContentTypeSingularEng,
  Exam
} from '../../../../types'
import { Spinner } from '../../../Spinner'
import { CertificateCard } from './CertificateCard'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaks } from '../../../../utils/formatUtils'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { Icon } from '../../../Icon'

type CertificateListProps = {
  exam: Exam
}

export const CertificateList = ({ exam }: CertificateListProps) => {
  const contentType = ContentType.todistukset
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()

  const singularActiveTab = ContentTypeSingular[contentType]

  const { data, loading, error } = useFetch<ContentOut<CertificateDtoOut>>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}`
  )

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaks(t('button.lisaatodistus'))}
            </InternalLink>
          )}
        </div>
      </div>

      {loading && <Spinner className="mt-10 text-center" />}

      {error && (
        <div className="flex justify-center w-full gap-2 text-red-primary">
          <Icon name="virheellinen" color="text-red-primary" />
          {lt.contentListErrorMessage[contentType]}
        </div>
      )}

      {data && (
        <ul className="mt-3 flex flex-wrap gap-5">
          {data.content.map((certificate, i) => (
            <CertificateCard certificate={certificate} key={`${exam}-${contentType}-${i}`} />
          ))}
        </ul>
      )}
    </div>
  )
}
