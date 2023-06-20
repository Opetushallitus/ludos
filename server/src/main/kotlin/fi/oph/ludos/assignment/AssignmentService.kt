package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(filters: AssignmentFilter): List<AssignmentOut> = db.getAssignments(filters)

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> db.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(exam: Exam, id: Int): AssignmentOut? = when (exam) {
        Exam.SUKO -> db.getSukoAssignmentById(id)
        Exam.PUHVI -> db.getPuhviAssignmentById(id)
        Exam.LD -> db.getLdAssignmentById(id)
    }

    fun updateAssignment(id: Int, assignment: Assignment): Int? = when (assignment) {
        is SukoAssignmentDtoIn -> db.updateSukoAssignment(assignment, id)
        is PuhviAssignmentDtoIn -> db.updatePuhviAssignment(assignment, id)
        is LdAssignmentDtoIn -> db.updateLdAssignment(assignment, id)
        else -> throw UnknownError("Unreachable")
    }

    fun getOppimaarasInUse(): List<String> = db.getOppimaarasInUse()
}