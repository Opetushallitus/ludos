package fi.oph.ludos.instruction

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.HasAnyRole
import fi.oph.ludos.HasYllapitajaRole
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/instruction")
class InstructionController(val service: InstructionService) {
    @PostMapping("")
    @HasYllapitajaRole
    fun createInstruction(@RequestBody instruction: Instruction): ResponseEntity<out Any> =
        ResponseEntity.ok().body(service.createInstruction(instruction))

    @GetMapping("/{exam}")
    @HasAnyRole
    fun getInstructions(
        @PathVariable exam: Exam
    ): List<InstructionOut> = service.getInstructions(exam)

    @GetMapping("/{exam}/{id}")
    @HasAnyRole
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): ResponseEntity<out Any> {
        val instructionDtoOut = service.getInstructionById(exam, id)

        return if (instructionDtoOut == null) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body("Instruction not found $id")
        } else {
            ResponseEntity.status(HttpStatus.OK).body(instructionDtoOut)
        }
    }

    @PutMapping("/{id}")
    @HasYllapitajaRole
    fun updateInstruction(
        @PathVariable("id") id: Int, @RequestBody instruction: Instruction
    ): ResponseEntity<Any> {
        val updatedInstructionId = service.updateInstruction(id, instruction)

        return if (updatedInstructionId == null) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body("Instruction not found $id")
        } else {
            ResponseEntity.status(HttpStatus.OK).body(updatedInstructionId)
        }
    }
}
