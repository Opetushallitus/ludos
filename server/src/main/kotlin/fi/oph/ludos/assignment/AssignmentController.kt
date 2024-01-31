package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@Validated
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/assignment")
class AssignmentController(val service: AssignmentService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createAssignment(@Valid @RequestBody assignment: Assignment): AssignmentOut =
        service.createAssignment(assignment)

    @GetMapping("SUKO")
    @RequireAtLeastOpettajaRole
    fun getSukoAssignments(
        @Valid filters: SukoFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("PUHVI")
    @RequireAtLeastOpettajaRole
    fun getPuhviAssignments(
        @Valid filters: PuhviFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("LD")
    @RequireAtLeastOpettajaRole
    fun getLdAssignments(
        @Valid filters: LdFilters
    ): AssignmentListDtoOut = service.getAssignments(filters)

    @GetMapping("{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getAssignment(@PathVariable exam: Exam, @PathVariable("id") id: Int): AssignmentOut =
        service.getAssignmentById(exam, id, null) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Assignment $id not found"
        )

    @GetMapping("{exam}/{id}/{version}")
    @RequireAtLeastYllapitajaRole
    fun getAssignmentVersion(
        @PathVariable exam: Exam,
        @PathVariable("id") id: Int,
        @PathVariable("version") version: Int
    ): AssignmentOut = service.getAssignmentById(exam, id, version) ?: throw ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Assignment $id or its version $version not found"
    )

    @GetMapping("{exam}/{id}/versions")
    @RequireAtLeastYllapitajaRole
    fun getAllVersionsOfAssignment(@PathVariable exam: Exam, @PathVariable id: Int): List<AssignmentOut> =
        service.getAllVersionsOfAssignment(exam, id)

    @PutMapping("{id}")
    @RequireAtLeastYllapitajaRole
    fun createNewVersionOfAssignment(@PathVariable("id") id: Int, @Valid @RequestBody assignment: Assignment): Int =
        service.createNewVersionOfAssignment(id, assignment) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Assignment $id not found"
        )

    @PostMapping("favorites/{exam}/folder")
    @RequireAtLeastOpettajaRole
    fun createNewFavoriteFolder(
        @PathVariable exam: Exam,
        @Valid @RequestBody folder: FavoriteFolderDtoIn
    ): Int = service.createNewFavoriteFolder(exam, folder)

    @PutMapping("favorites/{exam}/folder/{folderId}")
    @RequireAtLeastOpettajaRole
    fun updateFavoriteFolder(
        @PathVariable exam: Exam,
        @PathVariable folderId: Int,
        @Valid @RequestBody folder: FavoriteFolderDtoIn
    ): ResponseEntity<Nothing> {
        service.updateFavoriteFolder(exam, folderId, folder)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("favorites/{exam}/folder/{folderId}")
    @RequireAtLeastOpettajaRole
    fun deleteFavoriteFolder(@PathVariable exam: Exam, @PathVariable folderId: Int): ResponseEntity<Nothing> {
        val deletedCount = service.deleteFavoriteFolder(exam, folderId)
        when (deletedCount) {
            0 -> {
                throw ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Favorite folder $folderId not found for user ${Kayttajatiedot.fromSecurityContext().oidHenkilo}"
                )
            }

            1 -> {
                return ResponseEntity.ok().build()
            }

            else -> {
                throw ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unexpected delete count $deletedCount"
                )
            }
        }
    }

    @GetMapping("favorites/{exam}")
    @RequireAtLeastOpettajaRole
    fun getFavoriteIds(@PathVariable exam: Exam): FavoriteIdsDtoOut = service.getFavorites(exam, null)

    @GetMapping("favorites/{exam}/cardFolders")
    @RequireAtLeastOpettajaRole
    fun getFavoriteCardFolders(@PathVariable exam: Exam): FavoriteCardFolderDtoOut =
        service.getFavoriteCardFolders(exam)

    @GetMapping("favorites/{exam}/{assignmentId}")
    @RequireAtLeastOpettajaRole
    fun getFavoriteIdsForAssignment(@PathVariable exam: Exam, @PathVariable assignmentId: Int): FavoriteIdsDtoOut =
        service.getFavorites(exam, assignmentId)

    @PutMapping("favorites/{exam}/{assignmentId}")
    @RequireAtLeastOpettajaRole
    fun setAssignmentFavoriteFolders(
        @PathVariable exam: Exam,
        @PathVariable("assignmentId") assignmentId: Int,
        @Valid @RequestBody folderIds: List<Int>
    ): Int? = service.setAssignmentFavoriteFolders(exam, assignmentId, folderIds)

    @GetMapping("favorites/count")
    @RequireAtLeastOpettajaRole
    fun getFavoriteAssignmentsCount(): Int = service.getFavoriteAssignmentsCount()
}