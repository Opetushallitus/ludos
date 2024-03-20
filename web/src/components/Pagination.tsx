import { Icon } from './Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from './InternalLink'
import { SearchStringForNewFilterValue } from '../hooks/useFilterValues'
import { twMerge } from 'tailwind-merge'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../constants'
import { useLudosTranslation } from '../hooks/useLudosTranslation'

const FIRST_PAGE = 1
const START_ELLIPSIS_THRESHOLD = 1
const END_ELLIPSIS_THRESHOLD = 2

type PaginationProps = {
  page: number
  totalPages: number
  searchStringForNewFilterValue: SearchStringForNewFilterValue
}

export const Pagination = ({ page, totalPages, searchStringForNewFilterValue }: PaginationProps) => {
  const { t } = useLudosTranslation()
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  const prevDisabled = page === FIRST_PAGE
  const nextDisabled = page === totalPages

  const surroundingPageCount = isMobile ? 0 : 2
  const startPage = Math.max(FIRST_PAGE, page - surroundingPageCount)
  const endPage = Math.min(totalPages, page + surroundingPageCount)

  const centerPagesArr = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div className="flex flex-wrap justify-center items-center my-4">
      <InternalLink
        className="row my-auto font-semibold pr-10"
        to={searchStringForNewFilterValue('sivu', page - 1)}
        disabled={prevDisabled}
        data-testid="previous-page">
        <Icon name="chevronLeft" color={prevDisabled ? 'text-gray-secondary' : 'text-green-primary'} size="lg" />
        {!isMobile && t('pagination.link.edellinen-sivu')}
      </InternalLink>

      {startPage > START_ELLIPSIS_THRESHOLD && (
        <StartPagination currentPage={page} searchStringForNewFilterValue={searchStringForNewFilterValue} />
      )}

      {centerPagesArr.map((pageNumber) => (
        <PageLink
          key={pageNumber}
          number={pageNumber}
          currentPage={page}
          searchStringForNewFilterValue={searchStringForNewFilterValue}
        />
      ))}

      {endPage < totalPages && (
        <EndPagination
          totalPages={totalPages}
          currentPage={page}
          searchStringForNewFilterValue={searchStringForNewFilterValue}
        />
      )}

      <InternalLink
        className="row my-auto font-semibold pl-10"
        disabled={nextDisabled}
        to={searchStringForNewFilterValue('sivu', page + 1)}
        data-testid="next-page">
        {!isMobile && t('pagination.link.seuraava-sivu')}
        <Icon name="chevronRight" color={nextDisabled ? 'text-gray-secondary' : 'text-green-primary'} size="lg" />
      </InternalLink>
    </div>
  )
}

type PaginationComponentsBaseType = {
  currentPage: number
  searchStringForNewFilterValue: SearchStringForNewFilterValue
}

const StartPagination = ({ currentPage, searchStringForNewFilterValue }: PaginationComponentsBaseType) => (
  <>
    <PageLink
      number={FIRST_PAGE}
      currentPage={currentPage}
      searchStringForNewFilterValue={searchStringForNewFilterValue}
      data-testid="first-page"
    />
    {currentPage > START_ELLIPSIS_THRESHOLD && <span className="px-2">...</span>}
  </>
)

const EndPagination = ({
  totalPages,
  currentPage,
  searchStringForNewFilterValue
}: PaginationComponentsBaseType & {
  totalPages: number
}) => (
  <>
    {currentPage < totalPages - END_ELLIPSIS_THRESHOLD && <span className="px-2">...</span>}
    <PageLink
      number={totalPages}
      currentPage={currentPage}
      searchStringForNewFilterValue={searchStringForNewFilterValue}
      data-testid="last-page"
    />
  </>
)

const PageLink = ({
  number,
  currentPage,
  searchStringForNewFilterValue
}: PaginationComponentsBaseType & { number: number }) => (
  <InternalLink
    className={twMerge(
      'px-2 py-1 rounded-xl mx-1 cursor-pointer font-semibold',
      currentPage === number ? 'bg-green-primary text-white' : 'text-green-primary'
    )}
    to={searchStringForNewFilterValue('sivu', number)}
    data-testid={`page-button-${number}`}>
    {number}
  </InternalLink>
)
