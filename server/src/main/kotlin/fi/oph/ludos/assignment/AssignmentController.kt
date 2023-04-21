package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @GetMapping("/{examType}")
    fun getAssignments(@PathVariable examType: ExamType): List<AssignmentOut> {
        return service.getAssignments(examType)
    }

    @GetMapping("{examType}/{id}")
    fun getAssignment(@PathVariable("id") id: Int, @PathVariable examType: ExamType): AssignmentOut {
        return service.getAssignmentById(examType, id)
    }

    @PostMapping("/")
    fun createAssignment(@RequestBody assignment: Assignment): ResponseEntity<out Any> {
        return ResponseEntity.status(HttpStatus.OK).body(service.createAssignment(assignment))
    }

    @PutMapping("/{examType}/{id}")
    fun updateAssignment(
        @PathVariable examType: ExamType,
        @PathVariable("id") id: Int,
        @RequestBody assignment: SukoUpdateAssignmentDtoIn
    ): ResponseEntity<Int> {
        return try {
            val updatedAssignmentId = service.updateAssignment(examType, id, assignment)
            ResponseEntity.status(HttpStatus.OK).body(updatedAssignmentId)
        } catch (e: NotFoundException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }
}