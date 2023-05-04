import { AssignmentIn } from '../../../types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'
import { PdfTag } from '../../PdfTag'

type CertificateCardProps = {
  assignment: AssignmentIn
  exam: string
}

export const CertificateCard = ({ assignment, exam }: CertificateCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`assignment-${assignment.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${assignment.id}`}>
          {assignment.nameFi}
        </InternalLink>
        <Icon
          name="muokkaa"
          color="text-green-primary"
          dataTestId={`assignment-${assignment.id.toString()}-edit`}
          onClick={() =>
            navigate('update', {
              state: {
                assignment
              }
            })
          }
          customClass="ml-2"
        />
      </div>
      <div className="row mt-3 justify-between">
        <StateTag state={assignment.state} />
        <p className="text-center text-xs">{toLocaleDate(assignment.createdAt)}</p>
        <PdfTag />
      </div>
    </div>
  )
}
