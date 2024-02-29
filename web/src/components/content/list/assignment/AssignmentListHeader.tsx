import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { ContentTypeSingularFi, Exam } from '../../../../types'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { TeachingLanguageSelect } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { FilterValues } from '../../../../hooks/useFilterValues'

type AssignmentListHeaderProps = {
  exam: Exam
  filterValues: FilterValues
}

export const AssignmentListHeader = ({ exam, filterValues }: AssignmentListHeaderProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO

  return (
    <div className="row my-5 flex-wrap justify-between">
      <div className="w-full md:w-[20%]">
        {isYllapitaja && (
          <InternalLink
            className={buttonClasses('buttonPrimary')}
            to={`${location.pathname}/${uusiKey}`}
            data-testid={`create-${ContentTypeSingularFi.ASSIGNMENT}-button`}>
            {preventLineBreaksFromSpace(t('button.lisaakoetehtava'))}
          </InternalLink>
        )}
      </div>
      <div className="row gap-6">
        {shouldShowTeachingLanguageDropdown && (
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.koetehtavat-kieli')}</p>
            <TeachingLanguageSelect />
          </div>
        )}
        <ContentOrderFilter
          contentOrder={filterValues.filterValues.jarjesta}
          setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
        />
      </div>
    </div>
  )
}
