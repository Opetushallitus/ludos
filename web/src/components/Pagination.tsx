import { Button } from './Button'
import { Icon } from './Icon'
import { useTranslation } from 'react-i18next'
import { ReactNode } from 'react'

const FIRST_PAGE = 1
const START_ELLIPSIS_THRESHOLD = 1
const END_ELLIPSIS_THRESHOLD = 2

type OnPageChange = (page: number) => void

type PaginationProps = {
  children: ReactNode
  page: number
  totalPages?: number
  onPageChange: OnPageChange
}

export const Pagination = ({ children, page, totalPages, onPageChange }: PaginationProps) => {
  const { t } = useTranslation()

  if (!children || !totalPages) {
    return null
  }

  const prevDisabled = page === FIRST_PAGE
  const nextDisabled = page === totalPages

  const surroundingPageCount = 1
  const startPage = Math.max(FIRST_PAGE, page - surroundingPageCount)
  const endPage = Math.min(totalPages, page + surroundingPageCount)

  const centerPagesArr = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div className="flex justify-center items-center my-4">
      <Button
        className="row my-auto text-green-primary font-semibold disabled:text-gray-secondary pr-10"
        variant="buttonGhost"
        disabled={prevDisabled}
        onClick={() => onPageChange(page - 1)}
        data-testid="previous-page">
        <Icon name="chevronLeft" color={prevDisabled ? 'text-gray-secondary' : 'text-green-primary'} size="lg" />
        {t('button.pagination.edellinen-sivu')}
      </Button>

      {startPage > START_ELLIPSIS_THRESHOLD && <StartPagination currentPage={page} onPageChange={onPageChange} />}

      {centerPagesArr.map((pageNumber) => (
        <PageButton key={pageNumber} number={pageNumber} currentPage={page} onPageChange={onPageChange} />
      ))}

      {endPage < totalPages && <EndPagination totalPages={totalPages} currentPage={page} onPageChange={onPageChange} />}

      <Button
        className="row my-auto text-green-primary font-semibold disabled:text-gray-secondary pl-10"
        variant="buttonGhost"
        disabled={nextDisabled}
        onClick={() => onPageChange(page + 1)}
        data-testid="next-page">
        {t('button.pagination.seuraava-sivu')}
        <Icon name="chevronRight" color={nextDisabled ? 'text-gray-secondary' : 'text-green-primary'} size="lg" />
      </Button>
    </div>
  )
}

type PaginationComponentsBaseType = {
  currentPage: number
  onPageChange: OnPageChange
}

const StartPagination = ({ currentPage, onPageChange }: PaginationComponentsBaseType) => (
  <>
    <PageButton number={FIRST_PAGE} currentPage={currentPage} onPageChange={onPageChange} data-testid="first-page" />
    {currentPage > START_ELLIPSIS_THRESHOLD && <span className="px-2">...</span>}
  </>
)

const EndPagination = ({
  totalPages,
  currentPage,
  onPageChange
}: PaginationComponentsBaseType & {
  totalPages: number
}) => (
  <>
    {currentPage < totalPages - END_ELLIPSIS_THRESHOLD && <span className="px-2">...</span>}
    <PageButton number={totalPages} currentPage={currentPage} onPageChange={onPageChange} data-testid="last-page" />
  </>
)

const PageButton = ({ number, currentPage, onPageChange }: PaginationComponentsBaseType & { number: number }) => (
  <Button
    variant="buttonGhost"
    className={`px-2 py-1 rounded-xl mx-1 cursor-pointer font-semibold ${
      currentPage === number ? 'bg-green-primary text-white' : 'text-green-primary'
    }`}
    onClick={() => onPageChange(number)}
    data-testid={`page-button-${number}`}>
    {number}
  </Button>
)
