import { ContentType, ContentTypePluralFi, Exam } from '../../types'
import { Icon } from '../Icon'
import { InternalLink } from '../InternalLink'
import { contentListPath } from '../LudosRoutes'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const NavigationBoxes = () => {
  const { lt } = useLudosTranslation()

  const exams: Exam[] = Object.values(Exam)
  const contentTypes: ContentType[] = Object.values(ContentType)

  return (
    <>
      {exams.map((exam, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{lt.headingTextByExam[exam]}</h3>
          <div className="row flex-wrap gap-3 md:flex-nowrap" data-testid={`/${exam.toLowerCase()}`}>
            {contentTypes.map((contentType, i) => (
              <InternalLink
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                to={contentListPath(exam, contentType)}
                data-testid={`nav-box-${ContentTypePluralFi[contentType]}`}
                key={i}>
                <span className="row my-auto ml-3 gap-2">
                  <Icon name={ContentTypePluralFi[contentType]} color="text-green-primary" />
                  <p className="text-green-primary">{lt.buttonTextByContentType[contentType]}</p>
                </span>
              </InternalLink>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
