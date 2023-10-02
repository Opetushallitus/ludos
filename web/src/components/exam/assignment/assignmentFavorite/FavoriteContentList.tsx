import { AssignmentIn, ContentTypeSingularEng, Exam } from '../../../../types'
import { FiltersType, useFilterValues } from '../../../../hooks/useFilterValues'
import { useState } from 'react'
import { removeEmpty } from '../assignmentUtils'
import { AssignmentCard } from '../AssignmentCard'
import { Spinner } from '../../../Spinner'
import { AssignmentFilters } from '../AssignmentFilters'
import { Dropdown } from '../../../Dropdown'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
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
  exam: Exam
}

export const FavoriteContentList = ({ exam }: FavoriteContentListProps) => {
  const { SUKO_ASSIGNMENT_ORDER_OPTIONS, LANGUAGE_OPTIONS, t } = useLudosTranslation()

  const { filterValues, setFilterValue } = useFilterValues(exam, true)

  const [language, setLanguage] = useState<string>('fi')

  const { data, loading, refresh } = useFetch<AssignmentIn[]>(
    `${ContentTypeSingularEng.koetehtavat}/${exam}?${new URLSearchParams(
      removeEmpty<FiltersType>(filterValues)
    ).toString()}`
  )

  const {
    oppimaaraOptionsOverride,
    lukiodiplomiaineOptionsOverride,
    tehtavaTyyppiOptionsOverride,
    aiheOptionsOverride,
    lukuvuosiOverride
  } = useAssignmentFilterOverrides(exam, data)

  return (
    <div>
      <div className="row gap-6 my-3 flex-wrap justify-end">
        {exam !== Exam.SUKO && (
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.koetehtavat-kieli')}</p>
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
        )}

        <div className="flex flex-col gap-2 md:flex-row">
          <p className="mt-2">{t('filter.jarjesta')}</p>
          <div className="w-36">
            <Dropdown
              id="orderFilter"
              options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
              selectedOption={SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.koodiArvo === filterValues.jarjesta)}
              onSelectedOptionsChange={(opt: string) => setFilterValue('jarjesta', opt)}
            />
          </div>
        </div>
      </div>
      <AssignmentFilters
        exam={exam}
        filterValues={filterValues}
        setFilterValue={setFilterValue}
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
              <AssignmentCard language={language} assignment={assignment} exam={exam} key={i} refreshData={refresh} />
            ))}
      </ul>
    </div>
  )
}
