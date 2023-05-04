package fi.oph.ludos.instruction

import fi.oph.ludos.assignment.AssignmentFilter
import fi.oph.ludos.assignment.AssignmentOut
import fi.oph.ludos.assignment.Exam
import fi.oph.ludos.assignment.ExamType
import org.springframework.stereotype.Service

@Service
class InstructionService(val db: InstructionRepository) {
    fun createInstruction(instruction: Instruction): InstructionOut = when (instruction) {
        is SukoInstructionDtoIn -> db.saveSukoInstruction(instruction)
        is PuhviInstructionDtoIn -> db.savePuhviInstruction(instruction)
        is LdInstructionDtoIn -> db.saveLdInstruction(instruction)
        else -> throw UnknownError("Unreachable")
    }

    fun getInstructionById(exam: Exam, id: Int): InstructionOut = when (exam) {
        Exam.SUKO -> db.getSukoInstructionById(id)
        Exam.PUHVI -> db.getPuhviInstructionById(id)
        Exam.LD -> db.getLdInstructionById(id)
    }

    fun getInstructions(exam: Exam, examType: ExamType): List<InstructionOut> = when (exam) {
        Exam.SUKO -> db.getSukoInstructions(examType)
        Exam.PUHVI -> db.getPuhviInstructions(examType)
        Exam.LD -> db.getLdInstructions(examType)
    }
}