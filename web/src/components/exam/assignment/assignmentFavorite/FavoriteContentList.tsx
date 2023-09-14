import { AssignmentIn, ContentTypeEng, Exam } from '../../../../types'
import { useLocation } from 'react-router-dom'
import { FiltersType, useFilters } from '../../../../hooks/useFilters'
import { useEffect, useState } from 'react'
import { ContentTypeTranslationFinnish, removeEmpty } from '../assignmentUtils'
import { EXAM_TYPE_ENUM } from '../../../../constants'
import { AssignmentCard } from '../AssignmentCard'
import { Spinner } from '../../../Spinner'
import { AssignmentFilters } from '../AssignmentFilters'
import { Dropdown } from '../../../Dropdown'
import { useConstantsWithLocalization } from '../../../../hooks/useConstantsWithLocalization'
import { useTranslation } from 'react-i18next'
import { useFetch } from '../../../../hooks/useFetch'
import { useAssignmentFilterOverrides } from '../../../../hooks/useAssignmentFilterOverrides'

const filterByLanguage = (data: AssignmentIn, language: string) => {
  if (language === 'fi') {
    return data.nameFi !== ''
  } else if (language === 'sv') {
    return data.nameSv !== ''
  }
  return true
}

interface FavoriteContentListProps {
  activeTab: Exam
}

export const FavoriteContentList = ({ activeTab }: FavoriteContentListProps) => {
  const { t } = useTranslation()
  const location = useLocation()
  const { SUKO_ASSIGNMENT_ORDER_OPTIONS, LANGUAGE_OPTIONS } = useConstantsWithLocalization()

  const { filters, setFilters, resetFiltersAndParams } = useFilters({
    initialSearchFilters: location.search,
    contentType: ContentTypeEng.KOETEHTAVAT,
    basePath: `/favorites/${activeTab}`,
    showOnlyFavorites: true
  })

  useEffect(() => {
    resetFiltersAndParams()
  }, [activeTab, resetFiltersAndParams])

  const [language, setLanguage] = useState<string>('fi')

  const { data, loading, refresh } = useFetch<AssignmentIn[]>(
    `${EXAM_TYPE_ENUM.ASSIGNMENT}/${activeTab}?${new URLSearchParams(removeEmpty<FiltersType>(filters)).toString()}`
  )

  const {
    oppimaaraOptionsOverride,
    lukiodiplomiaineOptionsOverride,
    tehtavaTyyppiOptionsOverride,
    aiheOptionsOverride,
    lukuvuosiOverride
  } = useAssignmentFilterOverrides(activeTab, data)

  const handleFilterChange = (key: keyof FiltersType, value: string) =>
    setFilters((curr) => ({ ...curr, [key]: value }))

  return (
    <div>
      <div className="row gap-6 my-3 flex-wrap justify-end">
        <div className="flex flex-col gap-2 md:flex-row">
          <p className="mt-2">{t(`filter.${ContentTypeTranslationFinnish[ContentTypeEng.KOETEHTAVAT]}-kieli`)}</p>
          <div className="w-36">
            <Dropdown
              id="languageDropdown"
              options={LANGUAGE_OPTIONS}
              selectedOption={LANGUAGE_OPTIONS.find((opt) => opt.koodiArvo === language)}
              onSelectedOptionsChange={(opt: string) => setLanguage(opt)}
              testId="language-dropdown"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <p className="mt-2">{t('filter.jarjesta')}</p>
          <div className="w-36">
            <Dropdown
              id="orderFilter"
              options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
              selectedOption={SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.koodiArvo === filters.orderDirection)}
              onSelectedOptionsChange={(opt: string) => handleFilterChange('orderDirection', opt)}
            />
          </div>
        </div>
      </div>
      <AssignmentFilters
        exam={activeTab}
        filters={filters}
        setFilters={setFilters}
        oppimaaraOptionsOverride={oppimaaraOptionsOverride()}
        tehtavaTyyppiOptionsOverride={tehtavaTyyppiOptionsOverride()}
        aiheOptionsOverride={aiheOptionsOverride()}
        lukuvuosiOptionsOverride={lukuvuosiOverride()}
        lukiodiplomiaineOptionsOverride={lukiodiplomiaineOptionsOverride()}
      />
      {loading && <Spinner className="mt-10 text-center" />}
      <ul>
        {data &&
          data
            .filter((data) => filterByLanguage(data, language))
            .map((assignment, i) => (
              <AssignmentCard
                language={language}
                assignment={assignment}
                exam={activeTab}
                key={i}
                refreshData={refresh}
              />
            ))}
      </ul>
    </div>
  )
}
