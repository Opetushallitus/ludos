import { AssignmentIn } from '../../types'
import { ContentContent, ContentIconRow, ContentInstruction } from './ContentCommon'

type InstructionContentProps = {
  instruction: AssignmentIn
  language: string
}

export const InstructionContent = ({ instruction, language }: InstructionContentProps) => {
  return (
    <>
      <div className="my-3 bg-gray-bg px-3 pb-3 pt-2">
        <ContentIconRow />
      </div>
      <ContentInstruction
        language={language}
        instructionFi={instruction.instructionFi}
        instructionSv={instruction.instructionSv}
      />

      <div className="mb-4 border-b border-gray-separator" />

      <ContentContent language={language} contentFi={instruction.contentFi} contentSv={instruction.contentSv} />
    </>
  )
}
