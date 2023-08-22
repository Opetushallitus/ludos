package fi.oph.ludos.assignment

import fi.oph.ludos.*
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import javax.validation.Valid

@RestController
@Validated
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut =
        service.createAssignment(assignment)

    @GetMapping("oppimaaras")
    @RequireAtLeastOpettajaRole
    fun getOppimaarasInUse(): List<String> = service.getOppimaarasInUse()

    @GetMapping("SUKO")
    @RequireAtLeastOpettajaRole
    fun getSukoAssignments(
        @Valid filters: SukoBaseFilters
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("PUHVI")
    @RequireAtLeastOpettajaRole
    fun getPuhviAssignments(
        @Valid filters: PuhviBaseFilters
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("LD")
    @RequireAtLeastOpettajaRole
    fun getLdAssignments(
        @Valid filters: LdBaseFilters
    ): List<AssignmentOut> = service.getAssignments(filters)

    @GetMapping("{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut {
        val assignmentDtoOut = service.getAssignmentById(exam, id)

        return assignmentDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

    @PutMapping("{id}")
    @RequireAtLeastYllapitajaRole
    fun updateAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): Int {
        val updatedAssignmentId = service.updateAssignment(id, assignment)

        return updatedAssignmentId ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }
}