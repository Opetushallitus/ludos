package fi.oph.ludos.assignment

import fi.oph.ludos.*
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import javax.validation.Valid

@RestController
@Validated
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    @HasYllapitajaRole
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut =
        service.createAssignment(assignment)

    @GetMapping("oppimaaras")
    @HasAnyRole
    fun getOppimaarasInUse(): List<String> = service.getOppimaarasInUse()

    @GetMapping("SUKO")
    @HasAnyRole
    fun getSukoAssignments(
        @Valid filters: SukoAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("PUHVI")
    @HasAnyRole
    fun getPuhviAssignments(
        @Valid filters: PuhviAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("LD")
    @HasAnyRole
    fun getLdAssignments(
        @Valid filters: LdAssignmentFilter
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("{exam}/{id}")
    @HasAnyRole
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut {
        val assignmentDtoOut = service.getAssignmentById(exam, id)

        return assignmentDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

    @PutMapping("{id}")
    @HasYllapitajaRole
    fun updateAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): Int {
        val updatedAssignmentId = service.updateAssignment(id, assignment)

        return updatedAssignmentId ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }
}