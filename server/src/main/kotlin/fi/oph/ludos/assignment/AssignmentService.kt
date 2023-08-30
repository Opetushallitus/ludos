package fi.oph.ludos.assignment

import BaseFilters
import fi.oph.ludos.Exam
import org.springframework.stereotype.Service

@Service
class AssignmentService(val repository: AssignmentRepository) {
    fun getAssignments(filters: BaseFilters): List<AssignmentOut> = repository.getAssignments(filters)

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> repository.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> repository.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> repository.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(exam: Exam, id: Int): AssignmentOut? = repository.getAssignmentById(id, exam)

    fun getFavoriteAssignmentsCount(): Int = repository.getFavoriteAssignmentsCount()

    fun updateAssignment(id: Int, assignment: Assignment): Int? = when (assignment) {
        is SukoAssignmentDtoIn -> repository.updateSukoAssignment(assignment, id)
        is PuhviAssignmentDtoIn -> repository.updatePuhviAssignment(assignment, id)
        is LdAssignmentDtoIn -> repository.updateLdAssignment(assignment, id)
        else -> throw UnknownError("Unreachable")
    }

    fun getOppimaarasInUse(): List<String> = repository.getOppimaarasInUse()

    fun setAssignmentFavorite(exam: Exam, id: Int, isFavorite: Boolean): Int? =
        repository.setAssignmentFavorite(exam, id, isFavorite)
}