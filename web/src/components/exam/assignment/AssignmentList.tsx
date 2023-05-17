import { useEffect, useState } from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, Exam, ContentTypesEng, ValueOf, ContentType } from '../../../types'
import { AssignmentCard } from './AssignmentCard'
import { FiltersType, useFilters } from '../../../hooks/useFilters'
import { ContentTypeTranslationEnglish, getSingularContentTypeFinnish, removeEmpty } from './assignmentUtils'
import { InstructionCard } from '../instruction/InstructionCard'
import { AssignmentFilters } from './AssignmentFilters'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'
import { EXAM_TYPE_ENUM } from '../../../constants'
import { useLocation, useNavigate } from 'react-router-dom'
import { Dropdown } from '../../Dropdown'
import { LANGUAGE_OPTIONS, SUKO_ASSIGNMENT_ORDER_OPTIONS } from '../../../koodistoUtils'
import { useTranslation } from 'react-i18next'
import { Button } from '../../Button'
import { newKey } from '../../routes/routes'

export const AssignmentList = ({
  exam,
  contentType,
  activeTab
}: {
  exam: Exam
  contentType: string
  activeTab: ContentType
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { filters, setFilters, resetFilters } = useFilters(location.search, contentType)
  const [language, setLanguage] = useState<string>('fi')

  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  const urlByContentType = () => {
    if (contentType === ContentTypesEng.KOETEHTAVAT) {
      return `${EXAM_TYPE_ENUM.ASSIGNMENT}/${exam!.toLocaleUpperCase()}?${new URLSearchParams(
        removeNullsFromFilterObj
      ).toString()}`
    }

    if (contentType === ContentTypesEng.OHJEET) {
      return `${EXAM_TYPE_ENUM.INSTRUCTION}/${exam!.toLocaleUpperCase()}`
    }

    return `${EXAM_TYPE_ENUM.CERTIFICATE}/${exam!.toLocaleUpperCase()}`
  }

  const { data, loading, error, refresh } = useFetch<AssignmentIn[]>(urlByContentType())

  // refresh data on tab change
  useEffect(() => {
    const singularContentType = ContentTypeTranslationEnglish[activeTab]

    // if activeTab and content type are not the same, refresh data and reset filters
    if (contentType !== singularContentType) {
      refresh()
      resetFilters()
    }
  }, [activeTab, contentType, refresh, resetFilters])

  const handleFilterChange = <T,>(key: keyof FiltersType, value: T) => setFilters((curr) => ({ ...curr, [key]: value }))
  const singularActiveTab = getSingularContentTypeFinnish(activeTab)

  return (
    <div>
      {error && <div className="mt-10 text-center">Virhe ladattaessa koetehtäviä</div>}
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          <Button
            variant="buttonPrimary"
            onClick={() => navigate(`${location.pathname}/${newKey}`)}
            data-testid={`create-${singularActiveTab}-button`}>
            {t(`button.lisaa${singularActiveTab}`)}
          </Button>
        </div>
        <div className="row gap-6">
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.kieli')}</p>
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
                onSelectedOptionsChange={(opt: string) =>
                  handleFilterChange<ValueOf<FiltersType['orderDirection']>>('orderDirection', opt)
                }
              />
            </div>
          </div>
        </div>
      </div>
      {contentType === ContentTypesEng.KOETEHTAVAT && (
        <AssignmentFilters exam={exam} filters={filters} setFilters={setFilters} />
      )}
      {loading && (
        <div className="mt-10 text-center">
          <Spinner />
        </div>
      )}
      {data && (
        <>
          {contentType === ContentTypesEng.KOETEHTAVAT && (
            <ul>
              {data?.map((assignment, i) => (
                <AssignmentCard language={language} assignment={assignment} exam={exam} key={i} />
              ))}
            </ul>
          )}
          {contentType === ContentTypesEng.OHJEET && (
            <div className="mt-3 flex flex-wrap gap-5">
              <>{loading && <Spinner />}</>
              {data?.map((assignment, i) => (
                <InstructionCard assignment={assignment} exam={exam} key={i} />
              ))}
            </div>
          )}
          {contentType === ContentTypesEng.TODISTUKSET && (
            <div className="mt-3 flex flex-wrap gap-5">
              <>{loading && <Spinner />}</>
              {data?.map((assignment, i) => (
                <CertificateCard assignment={assignment} key={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
