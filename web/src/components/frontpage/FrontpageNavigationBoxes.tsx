import { ContentType, ContentTypeEng, Page } from '../../types'
import { Icon } from '../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../InternalLink'

interface NavigationBoxesProps {
  examPages: Page[]
}

export const NavigationBoxes = ({ examPages }: NavigationBoxesProps) => {
  const { t } = useTranslation()

  const contentTypes: ContentType[] = Object.values(ContentType)

  return (
    <>
      {examPages.map((examPage, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{t(`header.${examPage.key}`)}</h3>
          <div className="row flex-wrap gap-3 md:flex-nowrap" data-testid={`${examPage.path.replace('/content/', '')}`}>
            {contentTypes.map((contentType, i) => (
              <InternalLink
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                to={`${examPage.path}/${ContentTypeEng[contentType]}`}
                testId={`nav-box-${ContentTypeEng[contentType]}`}
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
