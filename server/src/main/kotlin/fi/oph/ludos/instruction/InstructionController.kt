package fi.oph.ludos.instruction

import fi.oph.ludos.Constants
import fi.oph.ludos.assignment.Exam
import fi.oph.ludos.assignment.ExamType
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
        @PathVariable exam: Exam, @RequestParam examType: ExamType
    ): List<InstructionOut> = service.getInstructions(exam, examType)

    @GetMapping("/{exam}/{id}")
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): InstructionOut =
        service.getInstructionById(exam, id)

}
