import { ContentType, Exam } from '../../types'
import { Icon } from '../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../InternalLink'
import { contentListPath } from '../routes/LudosRoutes'

export const NavigationBoxes = () => {
  const { t } = useTranslation()

  const exams: Exam[] = Object.values(Exam)
  const contentTypes: ContentType[] = Object.values(ContentType)

  return (
    <>
      {exams.map((exam, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{t(`header.${exam.toLowerCase()}`)}</h3>
          <div className="row flex-wrap gap-3 md:flex-nowrap" data-testid={`/${exam.toLowerCase()}`}>
            {contentTypes.map((contentType, i) => (
              <InternalLink
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                to={contentListPath(exam, contentType)}
                data-testid={`nav-box-${contentType}`}
                key={i}>
                <span className="row my-auto ml-3 gap-2">
                  <Icon name={contentType} color="text-green-primary" />
                  <p className="text-green-primary">{t(`button.${contentType}`)}</p>
                </span>
              </InternalLink>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
