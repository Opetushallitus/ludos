package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import javax.validation.Valid

@RestController
@Validated
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut = service.createAssignment(assignment)

    @GetMapping("oppimaaras")
    fun getOppimaarasInUse(): List<String> = service.getOppimaarasInUse()

    @GetMapping("SUKO")
    fun getSukoAssignments(
        @Valid filters: SukoAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("PUHVI")
    fun getPuhviAssignments(
        @Valid filters: PuhviAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("LD")
    fun getLdAssignments(
        @Valid filters: LdAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("{exam}/{id}")
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut =
        service.getAssignmentById(exam, id)

    @PutMapping("{id}")
    fun updateAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): ResponseEntity<Int> =
        try {
            val updatedAssignmentId = service.updateAssignment(id, assignment)
            ResponseEntity.status(HttpStatus.OK).body(updatedAssignmentId)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
}