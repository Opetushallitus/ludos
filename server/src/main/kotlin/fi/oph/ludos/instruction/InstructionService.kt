package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.ExamType
import org.springframework.stereotype.Service

@Service
class InstructionService(val db: InstructionRepository) {
    fun createInstruction(instruction: Instruction): InstructionOut = when (instruction) {
        is SukoInstructionDtoIn -> db.saveSukoInstruction(instruction)
        is PuhviInstructionDtoIn -> db.savePuhviInstruction(instruction)
        is LdInstructionDtoIn -> db.saveLdInstruction(instruction)
        else -> throw UnknownError("Unreachable")
    }

    fun getInstructions(exam: Exam): List<InstructionOut> = when (exam) {
        Exam.SUKO -> db.getSukoInstructions()
        Exam.PUHVI -> db.getPuhviInstructions()
        Exam.LD -> db.getLdInstructions()
    }

    fun getInstructionById(exam: Exam, id: Int): InstructionOut = when (exam) {
        Exam.SUKO -> db.getSukoInstructionById(id)
        Exam.PUHVI -> db.getPuhviInstructionById(id)
        Exam.LD -> db.getLdInstructionById(id)
    }

    fun updateInstruction(exam: Exam, id: Int, instruction: UpdateInstructionDtoIn): Int = when (exam) {
        Exam.SUKO -> db.updateSukoInstruction(id, instruction)
        Exam.PUHVI -> db.updatePuhviInstruction(id, instruction)
        Exam.LD -> db.updateLdInstruction(id, instruction)
    }
}