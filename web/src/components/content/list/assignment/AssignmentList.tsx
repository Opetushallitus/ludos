import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentOut,
  AssignmentsOut,
  ContentType,
  ContentTypeSingular,
  ContentTypeSingularEng,
  Exam,
  InstructionDtoOut,
  TeachingLanguage
} from '../../../../types'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { AssignmentCard } from './AssignmentCard'
import { Pagination } from '../../../Pagination'
import { TeachingLanguageSelect, TeachingLanguageSelectProps } from '../../../TeachingLanguageSelect'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaks } from '../../../../utils/formatUtils'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { AssignmentFilters } from './AssignmentFilters'
import { ListError } from '../ListError'
import { useTranslation } from 'react-i18next'

const filterByTeachingLanguage = (data: AssignmentOut | InstructionDtoOut, teachingLanguage: TeachingLanguage) => {
  if (teachingLanguage === TeachingLanguage.fi) {
    return data.nameFi !== ''
  } else if (teachingLanguage === TeachingLanguage.sv) {
    return data.nameSv !== ''
  }
  return true
}

type ContentListProps = {
  exam: Exam
  teachingLanguageSelectProps: TeachingLanguageSelectProps
  filterValues: FilterValues
  isFavoritePage?: boolean
}

export const AssignmentList = ({
  exam,
  teachingLanguageSelectProps,
  filterValues,
  isFavoritePage
}: ContentListProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t } = useTranslation()
  const singularActiveTab = ContentTypeSingular[ContentType.koetehtavat]

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO
  const contentType = ContentType.koetehtavat
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues.filterValues)

  const { data, refresh, DataWrapper } = useFetch<AssignmentsOut>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const teachingLanguage = teachingLanguageSelectProps.teachingLanguage

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && !isFavoritePage && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaks(t('button.lisaakoetehtava'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          {shouldShowTeachingLanguageDropdown && (
            <div className="flex flex-col gap-2 md:flex-row">
              <p className="mt-2">{t('filter.koetehtavat-kieli')}</p>
              <TeachingLanguageSelect {...teachingLanguageSelectProps} />
            </div>
          )}

          <ContentOrderFilter
            contentOrder={filterValues.filterValues.jarjesta}
            setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      <AssignmentFilters
        exam={exam}
        filterValues={filterValues}
        assignmentFilterOptions={data?.assignmentFilterOptions}
      />

      <DataWrapper
        errorEl={<ListError contentType={contentType} />}
        render={(data) => (
          <>
            <ul data-testid="assignment-list">
              {data.content
                .filter((val) => filterByTeachingLanguage(val, teachingLanguage))
                .map((assignment, i) => (
                  <AssignmentCard
                    teachingLanguage={teachingLanguage}
                    assignment={assignment}
                    exam={exam}
                    key={`${exam}-${contentType}-${i}`}
                    isFavoritePage={isFavoritePage}
                    refreshData={refresh}
                  />
                ))}
            </ul>

            <Pagination
              page={filterValues.filterValues.sivu}
              totalPages={data.totalPages!}
              searchStringForNewFilterValue={filterValues.searchStringForNewFilterValue}
            />
          </>
        )}
      />
    </div>
  )
}
