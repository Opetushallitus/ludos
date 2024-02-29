import { useFetch } from '../../../../hooks/useFetch'
import { ContentOut, ContentType, ContentTypeSingularEn, ContentTypeSingularFi, Exam } from '../../../../types'
import { CertificateCard } from './CertificateCard'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { TeachingLanguageSelectWithLabel } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { useContext } from 'react'
import { LudosContext } from '../../../../contexts/LudosContext'
import { InfoBox } from '../../../InfoBox'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'

type CertificateListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const CertificateList = ({ exam, filterValues: { filterValues, setFilterValue } }: CertificateListProps) => {
  const contentType = ContentType.CERTIFICATE
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO
  const singularActiveTab = ContentTypeSingularFi[contentType]
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues)

  const { data, loading, error } = useFetch<ContentOut>(
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
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaksFromSpace(t('button.lisaatodistus'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          {shouldShowTeachingLanguageDropdown && (
            <TeachingLanguageSelectWithLabel text={t('filter.todistukset-kieli')} />
          )}

          <ContentOrderFilter
            contentOrder={filterValues.jarjesta}
            setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      {error && <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />}

      {loading && <PageLoadingIndicator />}

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
