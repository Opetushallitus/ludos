package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
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

    @PutMapping("/{id}")
    fun updateAssignment() {
    }
}