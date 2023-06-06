package fi.oph.ludos.assignment

import fi.oph.ludos.*
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
    @HasYllapitajaRole
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut = service.createAssignment(assignment)

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
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut =
        service.getAssignmentById(exam, id)

    @PutMapping("{id}")
    @HasYllapitajaRole
    fun updateAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): ResponseEntity<Int> =
        try {
            val updatedAssignmentId = service.updateAssignment(id, assignment)
            ResponseEntity.status(HttpStatus.OK).body(updatedAssignmentId)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
}