package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

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

    fun getInstructionById(exam: Exam, id: Int): InstructionOut = try {
        when (exam) {
            Exam.SUKO -> db.getSukoInstructionById(id)
            Exam.PUHVI -> db.getPuhviInstructionById(id)
            Exam.LD -> db.getLdInstructionById(id)
        }

    } catch (e: NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
    }

    fun updateInstruction(id: Int, instruction: Instruction): Int = try {
        when (instruction) {
            is SukoInstructionDtoIn -> db.updateSukoInstruction(id, instruction)
            is PuhviInstructionDtoIn -> db.updatePuhviInstruction(id, instruction)
            is LdInstructionDtoIn -> db.updateLdInstruction(id, instruction)
            else -> throw UnknownError("Unreachable")
        }

    } catch (e: NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
    }
}