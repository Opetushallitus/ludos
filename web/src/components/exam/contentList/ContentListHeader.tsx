import { buttonClasses } from '../../Button'
import { ContentType, ContentTypeSingular, Exam, TeachingLanguage } from '../../../types'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { AssignmentFilters } from '../assignment/AssignmentFilters'
import { uusiKey } from '../../routes/LudosRoutes'
import { InternalLink } from '../../InternalLink'
import { preventLineBreaks } from '../../../formatUtils'
import { TeachingLanguageSelect } from '../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'

interface ContentListHeaderProps {
  exam: Exam
  contentType: ContentType
  filterValues: FiltersType
  setFilterValue: (key: keyof FiltersType, value: ParamsValue) => void
  teachingLanguage: TeachingLanguage
  setTeachingLanguage: (value: TeachingLanguage) => void
}

export const ContentListHeader = ({
  exam,
  contentType,
  filterValues,
  setFilterValue,
  teachingLanguage,
  setTeachingLanguage
}: ContentListHeaderProps) => {
  const { isYllapitaja } = useUserDetails()
  const { lt, t } = useLudosTranslation()

  const singularActiveTab = ContentTypeSingular[contentType]

  const shouldShowTeachingLanguageDropdown =
    contentType === ContentType.ohjeet || (contentType === ContentType.koetehtavat && exam !== Exam.SUKO)

  return (
    <>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaks(lt.addAssignmentTextByContentType[contentType])}
            </InternalLink>
          )}
        </div>
        {contentType !== ContentType.todistukset && (
          <div className="row gap-6">
            {shouldShowTeachingLanguageDropdown && (
              <div className="flex flex-col gap-2 md:flex-row">
                <p className="mt-2">
                  {contentType === ContentType.koetehtavat ? t('filter.koetehtavat-kieli') : t('filter.ohjeet-kieli')}
                </p>
                <TeachingLanguageSelect teachingLanguage={teachingLanguage} setTeachingLanguage={setTeachingLanguage} />
              </div>
            )}

            <ContentOrderFilter
              contentOrder={filterValues.jarjesta}
              setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder)}
            />
          </div>
        )}
      </div>
      {contentType === ContentType.koetehtavat && (
        <AssignmentFilters exam={exam} filterValues={filterValues} setFilterValue={setFilterValue} />
      )}
    </>
  )
}
