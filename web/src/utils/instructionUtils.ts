import {
  BaseOut,
  ContentType,
  Exam,
  InstructionDtoOut,
  LdInstructionDtoOut,
  SukoOrPuhviInstructionDtoOut
} from '../types'

export const isInstruction = (
  data: BaseOut,
  contentType: ContentType
): data is SukoOrPuhviInstructionDtoOut | LdInstructionDtoOut => contentType === ContentType.ohjeet

export const isLdInstruction = (instruction: InstructionDtoOut, exam: Exam): instruction is LdInstructionDtoOut =>
  exam === Exam.LD && 'aineKoodiArvo' in instruction

export const isSukoOrPuhviInstruction = (
  instruction: InstructionDtoOut,
  exam: Exam
): instruction is SukoOrPuhviInstructionDtoOut =>
  (exam === Exam.SUKO || exam === Exam.PUHVI) && 'shortDescriptionFi' in instruction
