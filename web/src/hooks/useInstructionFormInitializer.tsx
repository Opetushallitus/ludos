import { AttachmentData, AttachmentLanguage, Exam, InstructionIn } from '../types'
import { FieldValues, SetFieldValue, UseFormReset } from 'react-hook-form'
import { InstructionFormType } from '../components/exam/instruction/form/instructionSchema'
import { useEffect } from 'react'

type SetAttachmentDataFunction = (attachmentData: AttachmentData[]) => void

type InstructionFormEffectProps = {
  instruction?: InstructionIn
  exam: Exam
  reset: UseFormReset<InstructionFormType>
  setValue: SetFieldValue<FieldValues>
  setAttachmentDataFi: SetAttachmentDataFunction
  setAttachmentDataSv: SetAttachmentDataFunction
}

const convertToLowerCase = (language: 'FI' | 'SV') => language.toLowerCase() as AttachmentLanguage

function mapInstructionInAttachmentDataWithLanguage(
  instructionIn: InstructionIn,
  lang: AttachmentLanguage
): AttachmentData[] {
  const attachmentData = instructionIn.attachments.map((attachment) => ({
    attachment,
    name: attachment?.name ?? '',
    language: convertToLowerCase(attachment.language)
  }))

  return attachmentData.filter((it) => it.language === lang)
}

export function useInstructionFormInitializer({
  instruction,
  exam,
  reset,
  setValue,
  setAttachmentDataFi,
  setAttachmentDataSv
}: InstructionFormEffectProps) {
  useEffect(() => {
    if (instruction) {
      reset({
        ...instruction,
        exam
      })

      const attachmentDataFi = mapInstructionInAttachmentDataWithLanguage(instruction, 'fi')
      const attachmentDataSv = mapInstructionInAttachmentDataWithLanguage(instruction, 'sv')

      setAttachmentDataFi(attachmentDataFi)
      setAttachmentDataSv(attachmentDataSv)
    } else {
      setValue('exam', exam)
    }
  }, [instruction, exam, reset, setValue, setAttachmentDataFi, setAttachmentDataSv])
}
