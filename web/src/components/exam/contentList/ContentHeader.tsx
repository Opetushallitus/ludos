import { Button } from '../../Button'
import { newKey } from '../../routes/routes'
import { ContentType, ContentTypeEng, Exam } from '../../../types'
import { Dropdown } from '../../Dropdown'
import { FiltersType } from '../../../hooks/useFilters'
import { useNavigate } from 'react-router-dom'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useConstantsWithLocalization } from '../../../hooks/useConstantsWithLocalization'
import { useTranslation } from 'react-i18next'
import { ContentTypeTranslationFinnish, getSingularContentTypeFinnish } from '../assignment/assignmentUtils'
import { AssignmentFilters } from '../assignment/AssignmentFilters'
import { Dispatch, SetStateAction } from 'react'

interface ContentHeaderProps {
  exam: Exam
  activeTab: ContentType
  contentType: ContentTypeEng
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
  handleFilterChange: (a: keyof FiltersType, b: string) => void
  setLanguage: (value: string) => void
  language: string
}

export const ContentHeader = ({
  exam,
  activeTab,
  contentType,
  filters,
  setFilters,
  handleFilterChange,
  setLanguage,
  language
}: ContentHeaderProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isYllapitaja } = useUserDetails()
  const { SUKO_ASSIGNMENT_ORDER_OPTIONS, LANGUAGE_OPTIONS } = useConstantsWithLocalization()

  const singularActiveTab = getSingularContentTypeFinnish(activeTab)

  const languageFilterText = () => {
    const contentTypeFinnish = ContentTypeTranslationFinnish[contentType]
    return t(`filter.${contentTypeFinnish}-kieli`)
  }

  return (
    <>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <Button
              variant="buttonPrimary"
              onClick={() => navigate(`${location.pathname}/${newKey}`)}
              data-testid={`create-${singularActiveTab}-button`}>
              {t(`button.lisaa${singularActiveTab}`)}
            </Button>
          )}
        </div>
        {contentType !== ContentTypeEng.TODISTUKSET && (
          <div className="row gap-6">
            <div className="flex flex-col gap-2 md:flex-row">
              <p className="mt-2">{languageFilterText()}</p>
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
        )}
      </div>
      {contentType === ContentTypeEng.KOETEHTAVAT && (
        <AssignmentFilters exam={exam} filters={filters} setFilters={setFilters} />
      )}
    </>
  )
}
