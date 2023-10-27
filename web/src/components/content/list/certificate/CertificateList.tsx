import { useFetch } from '../../../../hooks/useFetch'
import { ContentOut, ContentType, ContentTypeSingular, ContentTypeSingularEng, Exam } from '../../../../types'
import { CertificateCard } from './CertificateCard'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { ListError } from '../ListError'
import { useTranslation } from 'react-i18next'
import { TeachingLanguageSelect } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { useContext } from 'react'
import { LudosContext } from '../../../../contexts/LudosContext'

type CertificateListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const CertificateList = ({ exam, filterValues: { filterValues, setFilterValue } }: CertificateListProps) => {
  const contentType = ContentType.todistukset
  const { isYllapitaja } = useUserDetails()
  const { t } = useTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO
  const singularActiveTab = ContentTypeSingular[contentType]
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues)

  const { data, error } = useFetch<ContentOut>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
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
            <div className="flex flex-col gap-2 md:flex-row">
              <p className="mt-2">{t('filter.todistukset-kieli')}</p>
              <TeachingLanguageSelect />
            </div>
          )}

          <ContentOrderFilter
            contentOrder={filterValues.jarjesta}
            setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      {error && <ListError contentType={ContentType.koetehtavat} />}
      {!error && data && (
        <ul className="mt-3 flex flex-wrap gap-5" data-testid="card-list">
          {data.content.map((certificate, i) => (
            <CertificateCard
              certificate={certificate}
              teachingLanguage={teachingLanguage}
              key={`${exam}-${contentType}-${i}`}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
