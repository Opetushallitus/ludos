package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import org.springframework.stereotype.Service

@Service
class AssignmentService(
    val repository: AssignmentRepository,
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
    fun getAssignments(filters: AssignmentBaseFilters): AssignmentListDtoOut = repository.getAssignments(filters)

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> repository.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> repository.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> repository.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(exam: Exam, id: Int, version: Int?): AssignmentOut? =
        repository.getAssignmentById(id, exam, version)

    fun getAllVersionsOfAssignment(exam: Exam, id: Int): List<AssignmentOut> =
        addUpdaterNames(repository.getAllVersionsOfAssignment(id, exam))

    fun addUpdaterNames(assignments: List<AssignmentOut>): List<AssignmentOut> {
        val uniqueOids = assignments.map { it.updaterOid }.toSet()
        val oidToName = uniqueOids.associateWith { oppijanumerorekisteriClient.getUserDetailsByOid(it) }
        return assignments.map {
            val updaterName = oidToName.getOrDefault(it.updaterOid, null)?.formatName()
            when (it) {
                is SukoAssignmentDtoOut -> it.copy(updaterName = updaterName)
                is LdAssignmentDtoOut -> it.copy(updaterName = updaterName)
                is PuhviAssignmentDtoOut -> it.copy(updaterName = updaterName)
                else -> throw RuntimeException("unreachable")
            }
        }
    }

    fun getFavoriteAssignmentsCount(): Int = repository.getFavoriteAssignmentsCount()

    fun createNewVersionOfAssignment(id: Int, assignment: Assignment): Int? = when (assignment) {
        is SukoAssignmentDtoIn -> repository.createNewVersionOfSukoAssignment(assignment, id)
        is PuhviAssignmentDtoIn -> repository.createNewVersionOfPuhviAssignment(assignment, id)
        is LdAssignmentDtoIn -> repository.createNewVersionOfLdAssignment(assignment, id)
        else -> throw UnknownError("Unreachable")
    }

    fun setAssignmentFavorite(exam: Exam, id: Int, isFavorite: Boolean): Int? =
        repository.setAssignmentFavorite(exam, id, isFavorite)
}