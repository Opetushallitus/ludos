import { ContentType, Page } from '../../types'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'
import { AssignmentKeyTranslationEnglish } from '../exam/assignment/assignmentUtils'
import { useTranslation } from 'react-i18next'

export const NavigationBoxes = ({ exams, assignments }: { exams: Page[]; assignments: ContentType[] }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      {exams.map((contentType, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{t(`header.${contentType.titleKey}`)}</h3>
          <div
            className="row flex-wrap gap-3 md:flex-nowrap"
            data-testid={`${contentType.path.replace('/content/', '')}`}>
            {assignments.map((option, i) => (
              <button
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                onClick={() => navigate(contentType.path, { state: { assignmentType: option } })}
                data-testid={`nav-box-${AssignmentKeyTranslationEnglish[option]}`}
                key={i}>
                <span className="row my-auto ml-3 gap-2">
                  <Icon name={option} color="text-green-primary" />
                  <p className="text-green-primary">{t(`button.${option}`)}</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
