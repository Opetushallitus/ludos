import { buttonClasses } from '../../Button'
import { ContentType, ContentTypeSingular, Exam } from '../../../types'
import { Dropdown } from '../../Dropdown'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { AssignmentFilters } from '../assignment/AssignmentFilters'
import { uusiKey } from '../../routes/LudosRoutes'
import { InternalLink } from '../../InternalLink'
import { preventLineBreaks } from '../../../formatUtils'

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
  const { lt, t, SUKO_ASSIGNMENT_ORDER_OPTIONS, LANGUAGE_OPTIONS } = useLudosTranslation()

  const singularActiveTab = ContentTypeSingular[contentType]

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
            {/*<div className="flex flex-col gap-2 md:flex-row">*/}
            {/*  <p className="mt-2">*/}
            {/*    {contentType === ContentType.koetehtavat ? t('filter.koetehtavat-kieli') : t('filter.ohjeet-kieli')}*/}
            {/*  </p>*/}
            {/*  <div className="w-36">*/}
            {/*    <Dropdown*/}
            {/*      id="languageDropdown"*/}
            {/*      options={LANGUAGE_OPTIONS}*/}
            {/*      selectedOption={LANGUAGE_OPTIONS.find((opt) => opt.koodiArvo === language)}*/}
            {/*      onSelectedOptionsChange={(opt: string) => setLanguage(opt)}*/}
            {/*      testId="language-dropdown"*/}
            {/*    />*/}
            {/*  </div>*/}
            {/*</div>*/}

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
        )}
      </div>
      {contentType === ContentType.koetehtavat && (
        <AssignmentFilters exam={exam} filterValues={filterValues} setFilterValue={setFilterValue} />
      )}
    </>
  )
}
