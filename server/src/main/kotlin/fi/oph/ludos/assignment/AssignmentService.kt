package fi.oph.ludos.assignment

import fi.oph.ludos.AUDIT_LOGGER_NAME
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class AssignmentService(
    val repository: AssignmentRepository,
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
    val auditLogger: Logger = LoggerFactory.getLogger(AUDIT_LOGGER_NAME)

    fun getAssignments(filters: AssignmentBaseFilters): AssignmentListDtoOut = repository.getAssignments(filters)

    fun createAssignment(assignment: Assignment): AssignmentOut {
        val createdAssignment = when (assignment) {
            is SukoAssignmentDtoIn -> repository.saveSukoAssignment(assignment)
            is PuhviAssignmentDtoIn -> repository.savePuhviAssignment(assignment)
            is LdAssignmentDtoIn -> repository.saveLdAssignment(assignment)
            else -> throw UnknownError("Unreachable")
        }
        auditLogger.info(
            "Created ${createdAssignment.contentType} assignment ${createdAssignment.id}" +
                    ", nameFi='${createdAssignment.nameFi}', nameSv='${createdAssignment.nameSv}'" +
                    ", publishState=${createdAssignment.publishState}"
        )
        return createdAssignment
    }

    fun getAssignmentById(exam: Exam, id: Int, version: Int?): AssignmentOut? =
        repository.getAssignmentsByIds(listOf(id), exam, version).firstOrNull()

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
            }
        }
    }

    fun createNewVersionOfAssignment(id: Int, assignment: Assignment): Int? = when (assignment) {
        is SukoAssignmentDtoIn -> repository.createNewVersionOfSukoAssignment(assignment, id)
        is PuhviAssignmentDtoIn -> repository.createNewVersionOfPuhviAssignment(assignment, id)
        is LdAssignmentDtoIn -> repository.createNewVersionOfLdAssignment(assignment, id)
        else -> throw UnknownError("Unreachable")
    }

    fun getFavoriteAssignmentsCount(): Int = repository.getFavoriteAssignmentsCount()

    fun setAssignmentFavoriteFolders(exam: Exam, id: Int, folderIds: List<Int>): Int? =
        repository.setAssignmentFavoriteFolders(exam, id, folderIds)

    fun getFavoriteCardFolders(exam: Exam): FavoriteCardFolderDtoOut = repository.getFavoritesCardFolders(exam)

    fun createNewFavoriteFolder(exam: Exam, folder: FavoriteFolderDtoIn): Int =
        repository.createNewFavoriteFolder(exam, folder)

    fun updateFavoriteFolder(exam: Exam, folderId: Int, folder: FavoriteFolderDtoIn): Unit =
        repository.updateFavoriteFolder(exam, folderId, folder)

    fun deleteFavoriteFolder(exam: Exam, folderId: Int): Int = repository.deleteFavoriteFolder(exam, folderId)

    fun getFavorites(exam: Exam, assignmentId: Int?): FavoriteIdsDtoOut = repository.getFavorites(exam, assignmentId)
}