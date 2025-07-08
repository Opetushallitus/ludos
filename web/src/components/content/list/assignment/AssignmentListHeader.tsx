import { FilterValues } from '../../../../hooks/useFilterValues'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { ContentTypeSingularFi, Exam } from '../../../../types'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { buttonClasses } from '../../../Button'
import { InternalLink } from '../../../InternalLink'
import { uusiKey } from '../../../LudosRoutes'
import { TeachingLanguageSelectWithLabel } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'

type AssignmentListHeaderProps = {
  exam: Exam
  filterValues: FilterValues
}

export const AssignmentListHeader = ({ exam, filterValues }: AssignmentListHeaderProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t } = useLudosTranslation()

  return (
    <div className="row my-5 flex-wrap justify-between">
      <div className="w-full md:w-[20%]">
        {isYllapitaja && (
          <InternalLink
            className={buttonClasses('buttonPrimary')}
            to={`${location.pathname}/${uusiKey}`}
            data-testid={`create-${ContentTypeSingularFi.ASSIGNMENT}-button`}
          >
            {preventLineBreaksFromSpace(t('button.lisaakoetehtava'))}
          </InternalLink>
        )}
      </div>
      <div className="row gap-6">
        <TeachingLanguageSelectWithLabel exam={exam} text={t('filter.koetehtavat-kieli')} />
        <ContentOrderFilter
          contentOrder={filterValues.filterValues.jarjesta}
          setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
        />
      </div>
    </div>
  )
}
