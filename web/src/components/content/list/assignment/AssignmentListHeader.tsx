import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { ContentTypeSingularFi, Exam } from '../../../../types'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { FilterValues } from '../../../../hooks/useFilterValues'
import { TeachingLanguageSelectWithLabel } from '../../../TeachingLanguageSelect'

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
        {shouldShowTeachingLanguageDropdown && <TeachingLanguageSelectWithLabel text={t('filter.koetehtavat-kieli')} />}
        <ContentOrderFilter
          contentOrder={filterValues.filterValues.jarjesta}
          setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
        />
      </div>
    </div>
  )
}
