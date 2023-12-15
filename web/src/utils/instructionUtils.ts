import { BaseOut, Exam, InstructionDtoOut, LdInstructionDtoOut, SukoOrPuhviInstructionDtoOut } from '../types'

export const isInstruction = (data: BaseOut): data is SukoOrPuhviInstructionDtoOut | LdInstructionDtoOut =>
  'attachments' in data

export const isLdInstruction = (instruction: InstructionDtoOut): instruction is LdInstructionDtoOut =>
  instruction.exam === Exam.LD && 'aineKoodiArvo' in instruction

export const isSukoOrPuhviInstruction = (instruction: InstructionDtoOut): instruction is SukoOrPuhviInstructionDtoOut =>
  (instruction.exam === Exam.SUKO || instruction.exam === Exam.PUHVI) && 'shortDescriptionFi' in instruction
