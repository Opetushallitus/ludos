package fi.oph.ludos.instruction

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/instruction")
class InstructionController(val service: InstructionService) {
    @PostMapping("")
    fun createInstruction(@RequestBody instruction: Instruction): ResponseEntity<out Any> =
        ResponseEntity.ok().body(service.createInstruction(instruction))

    @GetMapping("/{exam}")
    fun getInstructions(
        @PathVariable exam: Exam
    ): List<InstructionOut> = service.getInstructions(exam)

    @GetMapping("/{exam}/{id}")
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): InstructionOut =
        service.getInstructionById(exam, id)

    @PutMapping("/{id}")
    fun updateInstruction(
        @PathVariable("id") id: Int, @RequestBody instruction: Instruction
    ): ResponseEntity<Int> = try {
        val updatedAssignmentId = service.updateInstruction(id, instruction)
        ResponseEntity.status(HttpStatus.OK).body(updatedAssignmentId)
    } catch (e: NotFoundException) {
        ResponseEntity.status(HttpStatus.NOT_FOUND).build()
    }
}
