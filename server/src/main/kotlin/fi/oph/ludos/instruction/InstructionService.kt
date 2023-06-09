package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import org.springframework.stereotype.Service

@Service
class InstructionService(val db: InstructionRepository) {
    fun createInstruction(instruction: Instruction) = db.createInstruction(instruction)

    fun getInstructions(exam: Exam): List<InstructionOut> = db.getInstructions(exam)

    fun getInstructionById(exam: Exam, id: Int): InstructionOut? = db.getInstructionById(exam, id)

    fun updateInstruction(id: Int, instruction: Instruction): Int? = db.updateInstruction(id, instruction)
}