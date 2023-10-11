import { buttonClasses } from '../../Button'
import { ContentType, ContentTypeSingular, Exam } from '../../../types'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { AssignmentFilters } from '../assignment/AssignmentFilters'
import { uusiKey } from '../../routes/LudosRoutes'
import { InternalLink } from '../../InternalLink'
import { preventLineBreaks } from '../../../formatUtils'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../../ludosSelect/helpers'
import { LudosSelect } from '../../ludosSelect/LudosSelect'
import { sortKooditByArvo } from '../../../hooks/useKoodisto'

interface ContentListHeaderProps {
  exam: Exam
  contentType: ContentType
  filterValues: FiltersType
  setFilterValue: (key: keyof FiltersType, value: ParamsValue) => void
  setLanguage: (value: string) => void
  language: string
}

export const ContentListHeader = ({
  exam,
  contentType,
  filterValues,
  setFilterValue,
  setLanguage,
  language
}: ContentListHeaderProps) => {
  const { isYllapitaja } = useUserDetails()
  const { lt, t, ORDER_OPTIONS, LANGUAGE_OPTIONS } = useLudosTranslation()

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
                <div className="w-32">
                  <LudosSelect
                    name="languageDropdown"
                    options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
                    value={currentKoodistoSelectOption(language, LANGUAGE_OPTIONS)}
                    onChange={(opt) => opt && setLanguage(opt.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 md:flex-row">
              <p className="mt-2">{t('filter.jarjesta')}</p>
              <div className="w-40">
                <LudosSelect
                  name="orderFilter"
                  options={koodistoSelectOptions(sortKooditByArvo(ORDER_OPTIONS))}
                  value={currentKoodistoSelectOption(filterValues.jarjesta, ORDER_OPTIONS)}
                  onChange={(opt) => opt && setFilterValue('jarjesta', opt.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {contentType === ContentType.koetehtavat && (
        <AssignmentFilters exam={exam} filterValues={filterValues} setFilterValue={setFilterValue} />
      )}
    </>
  )
}
