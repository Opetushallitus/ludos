import { useFetch } from '../../../../hooks/useFetch'
import {
  CertificateDtoOut,
  ContentOut,
  ContentType,
  ContentTypeSingular,
  ContentTypeSingularEng,
  Exam
} from '../../../../types'
import { CertificateCard } from './CertificateCard'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaks } from '../../../../utils/formatUtils'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { ListError } from '../ListError'
import { useTranslation } from 'react-i18next'

type CertificateListProps = {
  exam: Exam
}

export const CertificateList = ({ exam }: CertificateListProps) => {
  const contentType = ContentType.todistukset
  const { isYllapitaja } = useUserDetails()
  const { t } = useTranslation()

  const singularActiveTab = ContentTypeSingular[contentType]

  const { DataWrapper } = useFetch<ContentOut<CertificateDtoOut>>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}`
  )

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaks(t('button.lisaatodistus'))}
            </InternalLink>
          )}
        </div>
      </div>

      <DataWrapper
        errorEl={<ListError contentType={contentType} />}
        render={(data) => (
          <ul className="mt-3 flex flex-wrap gap-5">
            {data.content.map((certificate, i) => (
              <CertificateCard exam={exam} certificate={certificate} key={`${exam}-${contentType}-${i}`} />
            ))}
          </ul>
        )}
      />
    </div>
  )
}
