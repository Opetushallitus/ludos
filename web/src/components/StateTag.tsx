import { AssignmentState } from '../types'

type TagAttributes = {
  text: string
  variant: string
}

function getTagAttributes(state: AssignmentState): TagAttributes {
  switch (state) {
    case AssignmentState.Draft:
      return { text: 'Luonnos', variant: 'bg-yellow' }
    case AssignmentState.Published:
      return { text: 'Julkaistu', variant: 'bg-green-light' }
    case AssignmentState.Archived:
      return { text: 'Archived', variant: 'bg-gray-secondary' }
  }
}

export const StateTag = ({ state }: { state: AssignmentState }) => {
  const tagAttributes = getTagAttributes(state)
  return <div className={`p-x-1 w-20 rounded ${tagAttributes.variant} text-center text-base`}>{tagAttributes.text}</div>
}
