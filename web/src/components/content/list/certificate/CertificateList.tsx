import { useContext } from 'react'
import { LudosContext } from '../../../../contexts/LudosContext'
import { useFetch } from '../../../../hooks/useFetch'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { ContentOut, ContentType, ContentTypeSingularEn, ContentTypeSingularFi, Exam } from '../../../../types'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { buttonClasses } from '../../../Button'
import { InfoBox } from '../../../InfoBox'
import { InternalLink } from '../../../InternalLink'
import { uusiKey } from '../../../LudosRoutes'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'
import { TeachingLanguageSelectWithLabel } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { CertificateCard } from './CertificateCard'

type CertificateListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const CertificateList = ({ exam, filterValues: { filterValues, setFilterValue } }: CertificateListProps) => {
  const contentType = ContentType.CERTIFICATE
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const singularActiveTab = ContentTypeSingularFi[contentType]
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues)

  const { data, isFetching, error } = useFetch<ContentOut>(
    ['certificateList'],
    `${ContentTypeSingularEn[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}
            >
              {preventLineBreaksFromSpace(t('button.lisaatodistus'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          <TeachingLanguageSelectWithLabel exam={exam} text={t('filter.todistukset-kieli')} />

          <ContentOrderFilter
            contentOrder={filterValues.jarjesta}
            setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      {error && <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />}

      {isFetching && <PageLoadingIndicator />}

      <ul className="mt-3 flex flex-wrap gap-5" data-testid="card-list">
        {data?.content.map((certificate, i) => (
          <CertificateCard
            certificate={certificate}
            teachingLanguage={teachingLanguage}
            key={`${exam}-${contentType}-${i}`}
          />
        ))}
      </ul>
    </div>
  )
}
