import { AssignmentOut, ContentTypeSingularEng, Exam, TeachingLanguage } from '../../../../types'
import { FiltersType, useFilterValues } from '../../../../hooks/useFilterValues'
import { useState } from 'react'
import { removeEmpty } from '../assignmentUtils'
import { AssignmentCard } from '../AssignmentCard'
import { Spinner } from '../../../Spinner'
import { AssignmentFilters } from '../AssignmentFilters'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useFetch } from '../../../../hooks/useFetch'
import { useAssignmentFilterOverrides } from '../../../../hooks/useAssignmentFilterOverrides'
import { TeachingLanguageSelect } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../../ContentOrderFilter'

const filterByTeachingLanguage = (data: AssignmentOut, teachingLanguage: TeachingLanguage) => {
  if (teachingLanguage === TeachingLanguage.fi) {
    return data.nameFi !== ''
  } else if (teachingLanguage === TeachingLanguage.sv) {
    return data.nameSv !== ''
  }
  return true
}

interface FavoriteContentListProps {
  exam: Exam
}

export const FavoriteContentList = ({ exam }: FavoriteContentListProps) => {
  const { t } = useLudosTranslation()
  const { filterValues, setFilterValue } = useFilterValues(exam, true)

  const [teachingLanguage, setTeachingLanguage] = useState<TeachingLanguage>(TeachingLanguage.fi)

  const { data, loading, refresh } = useFetch<AssignmentOut[]>(
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

  const languageOverrideIfSukoAssignment = exam === Exam.SUKO ? TeachingLanguage.fi : teachingLanguage

  return (
    <div>
      <div className="row gap-6 my-3 flex-wrap justify-end">
        {exam !== Exam.SUKO && (
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.koetehtavat-kieli')}</p>
            <TeachingLanguageSelect teachingLanguage={teachingLanguage} setTeachingLanguage={setTeachingLanguage} />
          </div>
        )}

        <ContentOrderFilter
          contentOrder={filterValues.jarjesta}
          setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder)}
        />
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
            .filter((data) => filterByTeachingLanguage(data, languageOverrideIfSukoAssignment))
            .map((assignment, i) => (
              <AssignmentCard
                teachingLanguage={languageOverrideIfSukoAssignment}
                assignment={assignment}
                exam={exam}
                key={i}
                refreshData={refresh}
              />
            ))}
      </ul>
    </div>
  )
}
