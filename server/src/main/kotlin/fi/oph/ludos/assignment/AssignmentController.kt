package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @GetMapping("/SUKO")
    fun getAssignments(): List<AssignmentOut> {
        return service.getAssignments(ExamType.SUKO)
    }

    @GetMapping("/{id}")
    fun getAssignment(@PathVariable("id") id: Int): AssignmentOut {
        return service.getAssignmentById(id)
    }

    @PostMapping("/")
    fun createAssignment(@RequestBody assignment: Assignment): AssignmentOut {
        return service.createAssignment(assignment)
    }

    @PutMapping("/{id}")
    fun updateAssignment() {
    }
}