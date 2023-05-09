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

    fun getInstructionById(exam: Exam, id: Int): InstructionOut = when (exam) {
        Exam.SUKO -> try {
            db.getSukoInstructionById(id)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }

        Exam.PUHVI -> try {
            db.getPuhviInstructionById(id)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }

        Exam.LD -> try {
            db.getLdInstructionById(id)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }
    }

    fun updateInstruction(exam: Exam, id: Int, instruction: UpdateInstructionDtoIn): Int = when (exam) {
        Exam.SUKO -> try {
            db.updateSukoInstruction(id, instruction)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }

        Exam.PUHVI -> try {
            db.updatePuhviInstruction(id, instruction)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }

        Exam.LD -> try {
            db.updateLdInstruction(id, instruction)
        } catch (e: NotFoundException) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
        }
    }
}