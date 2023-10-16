package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@Validated
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut =
        service.createAssignment(assignment)

    @GetMapping("SUKO")
    @RequireAtLeastOpettajaRole
    fun getSukoAssignments(
        @Valid filters: SukoFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("PUHVI")
    @RequireAtLeastOpettajaRole
    fun getPuhviAssignments(
        @Valid filters: PuhviFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("LD")
    @RequireAtLeastOpettajaRole
    fun getLdAssignments(
        @Valid filters: LdFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("favoriteCount")
    @RequireAtLeastOpettajaRole
    fun getFavoriteAssignmentsCount(): Int = service.getFavoriteAssignmentsCount()

    @GetMapping("{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut {
        val assignmentDtoOut = service.getAssignmentById(exam, id)

        return assignmentDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

    @PutMapping("{exam}/{id}/favorite")
    @RequireAtLeastOpettajaRole
    fun setAssignmentFavorite(
        @PathVariable exam: Exam, @PathVariable("id") id: Int, @Valid @RequestBody favoriteRequest: SetFavoriteRequest
    ): Int? = service.setAssignmentFavorite(exam, id, favoriteRequest.suosikki)

    @PutMapping("{id}")
    @RequireAtLeastYllapitajaRole
    fun updateAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): Int {
        val updatedAssignmentId = service.updateAssignment(id, assignment)

        return updatedAssignmentId ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

}