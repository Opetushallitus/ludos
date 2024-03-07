package fi.oph.ludos.assignment

import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import jakarta.servlet.ServletRequest
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

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
            is SukoAssignmentDtoIn -> repository.createNewVersionOfSukoAssignment(id, assignment)
            is LdAssignmentDtoIn -> repository.createNewVersionOfLdAssignment(id, assignment)
            is PuhviAssignmentDtoIn -> repository.createNewVersionOfPuhviAssignment(id, assignment)
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

    fun restoreOldVersionOfAssignment(
        exam: Exam,
        id: Int,
        version: Int,
        request: ServletRequest
    ): Int? {
        val assignmentToRestore = repository.getAssignmentsByIds(exam, listOf(id), version).firstOrNull() ?: return null

        val latestVersion = repository.getAssignmentsByIds(exam, listOf(id), null).first()
        if (version == latestVersion.version) {
            auditLogger.atWarn().addUserIp(request).addLudosUserInfo()
                .addKeyValue(
                    "restoreVersionInfo",
                    RestoreVersionInfoForLogging(exam, id, version, null)
                )
                .log("Tried to restore latest version of assignment")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot restore latest version")
        }

        val newAssignmentVersion = when (assignmentToRestore) {
            is SukoAssignmentDtoOut ->
                repository.createNewVersionOfSukoAssignment(id, SukoAssignmentDtoIn(assignmentToRestore))

            is LdAssignmentDtoOut ->
                repository.createNewVersionOfLdAssignment(id, LdAssignmentDtoIn(assignmentToRestore))

            is PuhviAssignmentDtoOut ->
                repository.createNewVersionOfPuhviAssignment(id, PuhviAssignmentDtoIn(assignmentToRestore))
        }

        auditLogger.atInfo().addUserIp(request).addLudosUserInfo()
            .addKeyValue(
                "restoreVersionInfo",
                RestoreVersionInfoForLogging(exam, id, version, newAssignmentVersion!!.version)
            ).log("Restored old version of assignment")

        return newAssignmentVersion.id
    }

    fun getAssignmentById(exam: Exam, id: Int, version: Int?): AssignmentOut? =
        repository.getAssignmentsByIds(exam, listOf(id), version).firstOrNull()

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