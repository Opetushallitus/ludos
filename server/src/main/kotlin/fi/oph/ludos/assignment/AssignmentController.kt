package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    fun createAssignment(@RequestBody assignment: Assignment): ResponseEntity<out Any> {
        return ResponseEntity.status(HttpStatus.OK).body(service.createAssignment(assignment))
    }

    @GetMapping("/{exam}")
    fun getAssignments(
        @PathVariable exam: Exam,
        @RequestParam examType: ExamType?,
        @RequestParam(required = false) course: String?,
        @RequestParam(required = false) assignmentType: String?,
        @RequestParam(required = false) title: String?,
        @RequestParam(required = false) language: String?,
        @RequestParam(required = false) orderBy: String?,
        @RequestParam(required = false) orderDirection: String?
    ): List<AssignmentOut> {

        val filters = AssignmentFilter(
            course,
            assignmentType,
            title,
            language,
            orderBy,
            orderDirection
        )

        return service.getAssignments(exam, examType, filters)
    }

    @GetMapping("{exam}/{id}")
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut {
        return service.getAssignmentById(exam, id)
    }

    @PutMapping("/{exam}/{id}")
    fun updateAssignment(
        @PathVariable exam: Exam,
        @PathVariable("id") id: Int,
        @RequestBody assignment: SukoUpdateAssignmentDtoIn
    ): ResponseEntity<Int> {
        return try {
            val updatedAssignmentId = service.updateAssignment(exam, id, assignment)
            ResponseEntity.status(HttpStatus.OK).body(updatedAssignmentId)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }
}