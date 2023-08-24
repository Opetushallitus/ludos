import { ContentType, Page } from '../../types'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'
import { ContentTypeTranslationEnglish } from '../exam/assignment/assignmentUtils'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../InternalLink'

interface NavigationBoxesProps {
  exams: Page[]
  contentTypes: ContentType[]
}

export const NavigationBoxes = ({ exams, contentTypes }: NavigationBoxesProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      {exams.map((exam, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{t(`header.${exam.titleKey}`)}</h3>
          <div className="row flex-wrap gap-3 md:flex-nowrap" data-testid={`${exam.path.replace('/content/', '')}`}>
            {contentTypes.map((contentType, i) => (
              <InternalLink
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                to={`${exam.path}/${ContentTypeTranslationEnglish[contentType]}`}
                testId={`nav-box-${ContentTypeTranslationEnglish[contentType]}`}
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
