package fi.oph.ludos.assignment

import fi.oph.ludos.AUDIT_LOGGER_NAME
import fi.oph.ludos.Exam
import fi.oph.ludos.addLudosUserInfo
import fi.oph.ludos.addUserIp
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import jakarta.servlet.ServletRequest
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class AssignmentService(
    val repository: AssignmentRepository,
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
    val auditLogger: Logger = LoggerFactory.getLogger(AUDIT_LOGGER_NAME)

    fun getAssignments(filters: AssignmentBaseFilters): AssignmentListDtoOut = repository.getAssignments(filters)

    fun createAssignment(assignment: Assignment, request: ServletRequest?): AssignmentOut {
        val createdAssignment = when (assignment) {
            is SukoAssignmentDtoIn -> repository.saveSukoAssignment(assignment)
            is PuhviAssignmentDtoIn -> repository.savePuhviAssignment(assignment)
            is LdAssignmentDtoIn -> repository.saveLdAssignment(assignment)
            else -> throw UnknownError("Unreachable")
        }
        auditLogger.atInfo().addLudosUserInfo()
            .addUserIp(request)
            .addKeyValue("assignment", AssignmentCardOut.fromAssignmentOut(createdAssignment))
            .log("Created assignment")
        return createdAssignment
    }

    fun createNewVersionOfAssignment(id: Int, assignment: Assignment, request: ServletRequest): Int? {
        val newAssignmentVersion = when (assignment) {
            is SukoAssignmentDtoIn -> repository.createNewVersionOfSukoAssignment(assignment, id)
            is LdAssignmentDtoIn -> repository.createNewVersionOfLdAssignment(assignment, id)
            is PuhviAssignmentDtoIn -> repository.createNewVersionOfPuhviAssignment(assignment, id)
            else -> throw UnknownError("Unreachable")
        }
        if (newAssignmentVersion != null) {
            auditLogger.atInfo().addUserIp(request).addLudosUserInfo()
                .addKeyValue("assignment", AssignmentCardOut.fromAssignmentOut(newAssignmentVersion))
                .log("Created new version of assignment")
        } else {
            auditLogger.atError().addUserIp(request).addLudosUserInfo()
                .addKeyValue("assignmentId", id)
                .log("Tried to create new version of non-existent assignment")
        }

        return newAssignmentVersion?.id
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