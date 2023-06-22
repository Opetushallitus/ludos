package fi.oph.ludos.instruction

import fi.oph.ludos.*
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import fi.oph.ludos.auth.RequireYllapitajaRoleByDefault
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("${Constants.API_PREFIX}/instruction")
@RequireYllapitajaRoleByDefault
class InstructionController(val service: InstructionService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createInstruction(@RequestBody instruction: Instruction) = service.createInstruction(instruction)

    @GetMapping("/{exam}")
    @RequireAtLeastOpettajaRole
    fun getInstructions(
        @PathVariable exam: Exam
    ): List<InstructionOut> = service.getInstructions(exam)

    @GetMapping("/{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): InstructionOut {
        val instructionDtoOut = service.getInstructionById(exam, id)

        return instructionDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
    }

    @PutMapping("/{id}")
    @RequireAtLeastYllapitajaRole
    fun updateInstruction(
        @PathVariable("id") id: Int, @RequestBody instruction: Instruction
    ): Int {
        val updatedInstructionId = service.updateInstruction(id, instruction)

        return updatedInstructionId ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
    }
}
