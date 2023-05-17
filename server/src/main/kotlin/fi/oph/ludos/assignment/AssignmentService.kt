package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(filters: AssignmentFilter): List<AssignmentOut> = db.getAssignments(filters)

    fun createSukoAssignment(assignment: SukoAssignmentDtoIn): AssignmentOut = db.saveSukoAssignment(assignment)

    fun createLdAssignment(assignment: LdAssignmentDtoIn): AssignmentOut = db.saveLdAssignment(assignment)

    fun createPuhviAssignment(assignment: PuhviAssignmentDtoIn): AssignmentOut = db.savePuhviAssignment(assignment)

    fun getAssignmentById(exam: Exam, id: Int): AssignmentOut = try {
        when (exam) {
            Exam.SUKO -> db.getSukoAssignmentById(id)
            Exam.PUHVI -> db.getPuhviAssignmentById(id)
            Exam.LD -> db.getLdAssignmentById(id)
        }
    } catch (e: NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

    fun updateAssignment(id: Int, assignment: Assignment): Int = try {
        when (assignment) {
            is SukoAssignmentDtoIn -> db.updateSukoAssignment(assignment, id)
            is PuhviAssignmentDtoIn -> db.updatePuhviAssignment(assignment, id)
            is LdAssignmentDtoIn -> db.updateLdAssignment(assignment, id)
            else -> throw UnknownError("Unreachable")
        }
    } catch (e: NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
    }

    fun getOppimaarasInUse(): List<String> = db.getOppimaarasInUse()
}