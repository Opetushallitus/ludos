package fi.oph.ludos.assignment

import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.junit.jupiter.api.DynamicTest.dynamicTest
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentFavoritesTest : AssignmentRequests() {

    @BeforeAll
    fun setup() {
        emptyDb(mockMvc)
    }

    @Nested
    @DisplayName("create folder")
    inner class CreateFolder {
        @TestFactory
        @WithOpettajaRole
        fun `valid request`() = Exam.entries.map { exam ->
            dynamicTest("valid request $exam") {
                val folderName = "Folder creation test $exam"
                val folder = FavoriteFolderDtoIn(folderName, ROOT_FOLDER_ID)

                assertThat(getFavoriteIds(exam).rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        ROOT_FOLDER_NAME,
                        emptyList()
                    )
                )

                createFavoriteFolder(exam, folder)

                assertThat(getFavoriteIds(exam).rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        ROOT_FOLDER_NAME,
                        listOf(FavoriteFolderWithoutId(folderName, emptyList()))
                    )
                )
            }
        }

        private fun testCreateFolderBadRequest(
            folderToCreate: FavoriteFolderDtoIn,
            expectedErrorMessage: String
        ) {
            val errorMessage =
                performWithCsrf(createFavoriteFolderReq(Exam.SUKO, mapper.writeValueAsString(folderToCreate)))
                    .andExpect(status().isBadRequest)
                    .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo(expectedErrorMessage)
        }

        @Test
        @WithOpettajaRole
        fun `empty name`() {
            testCreateFolderBadRequest(
                FavoriteFolderDtoIn("", ROOT_FOLDER_ID),
                "name: size must be between 1 and $MAX_FAVORITE_FOLDER_NAME_LENGTH"
            )
        }

        @Test
        @WithOpettajaRole
        fun `name too long`() {
            createFavoriteFolder(
                Exam.SUKO,
                FavoriteFolderDtoIn("X".repeat(MAX_FAVORITE_FOLDER_NAME_LENGTH), ROOT_FOLDER_ID)
            ) // maksimipituus sallitaan
            testCreateFolderBadRequest(
                FavoriteFolderDtoIn("X".repeat(MAX_FAVORITE_FOLDER_NAME_LENGTH + 1), ROOT_FOLDER_ID),
                "name: size must be between 1 and $MAX_FAVORITE_FOLDER_NAME_LENGTH"
            )
        }

        @Test
        @WithOpettajaRole
        fun `non-existent parent`() {
            val nonExistentParentId = -1
            testCreateFolderBadRequest(
                FavoriteFolderDtoIn("Kansio", nonExistentParentId),
                "Parent folder $nonExistentParentId not found for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}"
            )
        }
    }


    @Nested
    @DisplayName("update folder")
    inner class UpdateFolder {
        @TestFactory
        @WithOpettajaRole
        fun `valid move and rename`() = Exam.entries.map { exam ->
            dynamicTest("valid move and rename $exam") {
                val folder1In = FavoriteFolderDtoIn("Kansio 1", ROOT_FOLDER_ID)
                val folder1Id = createFavoriteFolder(exam, folder1In)
                val folder2In = FavoriteFolderDtoIn("Kansio 2", ROOT_FOLDER_ID)
                val folder2Id = createFavoriteFolder(exam, folder2In)

                val assignmentOut: AssignmentOut = createAssignment(minimalAssignmentIn(exam))
                setAssignmentFavoriteFolders(exam, assignmentOut.id, listOf(ROOT_FOLDER_ID, folder1Id))

                val favoriteIdsBeforeUpdate = getFavoriteIds(exam)
                assertThat(favoriteIdsBeforeUpdate.rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        name = ROOT_FOLDER_NAME,
                        subfolders = listOf(
                            FavoriteFolderWithoutId(folder1In.name, emptyList()),
                            FavoriteFolderWithoutId(folder2In.name, emptyList()),
                        ),
                    )
                )
                val expectedFolderIdsByAssignmentIdBeforeAndAfterUpdate = mapOf(
                    assignmentOut.id to listOf(
                        ROOT_FOLDER_ID,
                        folder1Id
                    )
                )
                assertThat(favoriteIdsBeforeUpdate.folderIdsByAssignmentId).isEqualTo(
                    expectedFolderIdsByAssignmentIdBeforeAndAfterUpdate
                )

                val folder1InUpdated = FavoriteFolderDtoIn("Kansio 1 paivitetty", folder2Id)
                updateFavoriteFolder(exam, folder1Id, folder1InUpdated)

                val favoriteIdsAfterUpdate = getFavoriteIds(exam)
                assertThat(favoriteIdsAfterUpdate.rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        name = ROOT_FOLDER_NAME,
                        subfolders = listOf(
                            FavoriteFolderWithoutId(
                                folder2In.name, listOf(
                                    FavoriteFolderWithoutId(folder1InUpdated.name, emptyList())
                                )
                            ),
                        ),
                    )
                )
                assertThat(favoriteIdsAfterUpdate.folderIdsByAssignmentId).isEqualTo(
                    expectedFolderIdsByAssignmentIdBeforeAndAfterUpdate
                )

            }
        }

        private fun testUpdateFolderBadRequest(
            folderId: Int,
            updatedFolder: FavoriteFolderDtoIn,
            expectedErrorMessage: String
        ) {
            val errorMessage =
                performWithCsrf(updateFavoriteFolderReq(Exam.SUKO, folderId, mapper.writeValueAsString(updatedFolder)))
                    .andExpect(status().isBadRequest)
                    .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo(expectedErrorMessage)
        }

        @Test
        @WithOpettajaRole
        fun root() {
            testUpdateFolderBadRequest(
                ROOT_FOLDER_ID,
                FavoriteFolderDtoIn("Kansio", ROOT_FOLDER_ID),
                "Root folder cannot be updated"
            )
        }

        @Test
        @WithOpettajaRole
        fun `non-existent id`() {
            val nonExistentFolderId = -1
            val folder = FavoriteFolderDtoIn("Kansio", ROOT_FOLDER_ID)
            performWithCsrf(updateFavoriteFolderReq(Exam.SUKO, nonExistentFolderId, mapper.writeValueAsString(folder)))
                .andExpect(status().isNotFound)
        }

        @Test
        @WithOpettajaRole
        fun `empty name`() {
            val folderId = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio", ROOT_FOLDER_ID))
            testUpdateFolderBadRequest(
                folderId,
                FavoriteFolderDtoIn("", ROOT_FOLDER_ID),
                "name: size must be between 1 and $MAX_FAVORITE_FOLDER_NAME_LENGTH"
            )
        }

        @Test
        @WithOpettajaRole
        fun `name too long`() {
            val folderId = createFavoriteFolder(
                Exam.SUKO,
                FavoriteFolderDtoIn("X".repeat(MAX_FAVORITE_FOLDER_NAME_LENGTH), ROOT_FOLDER_ID)
            )
            testUpdateFolderBadRequest(
                folderId,
                FavoriteFolderDtoIn("X".repeat(MAX_FAVORITE_FOLDER_NAME_LENGTH + 1), ROOT_FOLDER_ID),
                "name: size must be between 1 and $MAX_FAVORITE_FOLDER_NAME_LENGTH"
            )
        }

        @Test
        @WithOpettajaRole
        fun `non-existent parent`() {
            val folderId = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio", ROOT_FOLDER_ID))
            val nonExistentParentId = -1
            testUpdateFolderBadRequest(
                folderId,
                FavoriteFolderDtoIn("Kansio", nonExistentParentId),
                "Parent folder $nonExistentParentId not found for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}"
            )
        }

        @Test
        @WithOpettajaRole
        fun `set parentId to self`() {
            val folderId = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio", ROOT_FOLDER_ID))
            testUpdateFolderBadRequest(
                folderId,
                FavoriteFolderDtoIn("Kansio", folderId),
                "Cannot move folder under itself"
            )
        }

        @Test
        @WithOpettajaRole
        fun `set parentId to descendant folder`() {
            val folder1Id = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio 1", ROOT_FOLDER_ID))
            val folder2Id = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio 2", folder1Id))
            val folder3Id = createFavoriteFolder(Exam.SUKO, FavoriteFolderDtoIn("Kansio 3", folder2Id))

            testUpdateFolderBadRequest(
                folder1Id,
                FavoriteFolderDtoIn("Kansio 1", folder3Id),
                "Cannot move folder under itself"
            )
        }

        @Test
        @WithOpettajaRole
        fun `someone else owns`() {
            val folderIn = FavoriteFolderDtoIn("Kansio 1", ROOT_FOLDER_ID)
            val folderId = createFavoriteFolder(Exam.SUKO, folderIn, yllapitajaUser)

            val updatedFolder1 = FavoriteFolderDtoIn("Kansio 1", ROOT_FOLDER_ID)
            performWithCsrf(updateFavoriteFolderReq(Exam.SUKO, folderId, mapper.writeValueAsString(updatedFolder1)))
                .andExpect(status().isNotFound)

            assertThat(getFavoriteIds(Exam.SUKO, yllapitajaUser).rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                FavoriteFolderWithoutId(
                    ROOT_FOLDER_NAME,
                    listOf(FavoriteFolderWithoutId(folderIn.name, emptyList()))
                )
            )
        }
    }


    @Nested
    @DisplayName("delete folder")
    inner class DeleteFolder {
        @TestFactory
        @WithOpettajaRole
        fun `valid deletion`() = Exam.entries.map { exam ->
            dynamicTest("valid deletion $exam") {
                val folder1In = FavoriteFolderDtoIn("Folder delete test $exam 1", ROOT_FOLDER_ID)
                val folder1Id = createFavoriteFolder(exam, folder1In)
                val folder2In = FavoriteFolderDtoIn("Folder delete test $exam 2", folder1Id)
                val folder2Id = createFavoriteFolder(exam, folder2In)
                val folder3In = FavoriteFolderDtoIn("Folder delete test $exam 3", ROOT_FOLDER_ID)
                createFavoriteFolder(exam, folder3In)

                val assignmentOut: AssignmentOut = createAssignment(minimalAssignmentIn(exam))
                setAssignmentFavoriteFolders(exam, assignmentOut.id, listOf(folder2Id))

                val favoriteIdsBeforeDelete = getFavoriteIds(exam)
                assertThat(favoriteIdsBeforeDelete.rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        name = ROOT_FOLDER_NAME,
                        subfolders = listOf(
                            FavoriteFolderWithoutId(
                                name = folder1In.name,
                                subfolders = listOf(
                                    FavoriteFolderWithoutId(name = folder2In.name, subfolders = emptyList())
                                )
                            ),
                            FavoriteFolderWithoutId(name = folder3In.name, subfolders = emptyList())
                        )
                    )
                )
                assertThat(favoriteIdsBeforeDelete.folderIdsByAssignmentId).isEqualTo(
                    mapOf(assignmentOut.id to listOf(folder2Id))
                )

                deleteFavoriteFolder(exam, folder1Id)

                val favoriteIdsAfterDelete = getFavoriteIds(exam)
                assertThat(favoriteIdsAfterDelete.rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        name = ROOT_FOLDER_NAME,
                        subfolders = listOf(
                            FavoriteFolderWithoutId(name = folder3In.name, subfolders = emptyList())
                        )
                    )
                )
                assertThat(favoriteIdsAfterDelete.folderIdsByAssignmentId).isEmpty()
            }
        }

        @Test
        @WithOpettajaRole
        fun root() {
            val errorMessage = performWithCsrf(deleteFavoriteFolderReq(Exam.SUKO, ROOT_FOLDER_ID))
                .andExpect(status().isBadRequest)
                .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo("Root folder cannot be deleted")
        }

        @Test
        @WithOpettajaRole
        fun `non-existent folderId`() {
            val nonExistentFolderId = -1
            val errorMessage = performWithCsrf(deleteFavoriteFolderReq(Exam.SUKO, nonExistentFolderId))
                .andExpect(status().isNotFound)
                .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo("Favorite folder $nonExistentFolderId not found for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}")
        }

        @Test
        @WithOpettajaRole
        fun `someone else owns`() {
            val folderIn = FavoriteFolderDtoIn("Toisen omistaman kansion poistotesti", ROOT_FOLDER_ID)
            val folderId = createFavoriteFolder(Exam.SUKO, folderIn, yllapitajaUser)
            val errorMessage = performWithCsrf(deleteFavoriteFolderReq(Exam.SUKO, folderId))
                .andExpect(status().isNotFound)
                .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo("Favorite folder $folderId not found for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}")

            assertThat(getFavoriteIds(Exam.SUKO, yllapitajaUser).rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                FavoriteFolderWithoutId(
                    ROOT_FOLDER_NAME,
                    listOf(FavoriteFolderWithoutId(folderIn.name, emptyList()))
                )
            )
        }
    }

    data class Favorites(
        val favoriteFolderIns: List<FavoriteFolderDtoIn>,
        val favoriteFolderIds: List<Int>,
        val assignmentOuts: List<AssignmentOut>,
        val expectedFavoriteIds: FavoriteIdsDtoOut,
        val expectedCardFolders: FavoriteCardFolderDtoOut
    )


    @Nested
    @DisplayName("get favorite ids and cards")
    inner class GetFavoriteIds {

        private fun createSomeFavorites(exam: Exam): Favorites {
            val folder1In = FavoriteFolderDtoIn("Folder 1", ROOT_FOLDER_ID)
            val folder1Id = createFavoriteFolder(exam, folder1In)
            val folder2In = FavoriteFolderDtoIn("Folder 2", folder1Id)
            val folder2Id = createFavoriteFolder(exam, folder2In)
            val folder3In = FavoriteFolderDtoIn("Folder 3", ROOT_FOLDER_ID)
            val folder3Id = createFavoriteFolder(exam, folder3In)

            val assignment1Out: AssignmentOut = createAssignment(minimalAssignmentIn(exam))
            val assignment2Out: AssignmentOut = createAssignment(minimalAssignmentIn(exam))
            val assignment3Out: AssignmentOut = createAssignment(minimalAssignmentIn(exam))

            setAssignmentFavoriteFolders(exam, assignment1Out.id, listOf(folder1Id))
            setAssignmentFavoriteFolders(exam, assignment2Out.id, listOf(ROOT_FOLDER_ID, folder2Id))
            setAssignmentFavoriteFolders(exam, assignment3Out.id, emptyList())

            val assignmentOuts = listOf(assignment1Out, assignment2Out, assignment3Out)
            val cardFolders = FavoriteCardFolderDtoOut(
                -1,
                ROOT_FOLDER_NAME,
                listOf(
                    FavoriteCardFolderDtoOut(
                        -1,
                        folder1In.name,
                        listOf(
                            FavoriteCardFolderDtoOut(
                                -1,
                                folder2In.name,
                                emptyList(),
                                listOf(AssignmentCardOut.fromAssignmentOut(assignment2Out))
                            )
                        ),
                        listOf(AssignmentCardOut.fromAssignmentOut(assignment1Out))
                    ),
                    FavoriteCardFolderDtoOut(-1, folder3In.name, emptyList(), emptyList())
                ),
                listOf(AssignmentCardOut.fromAssignmentOut(assignment2Out))
            )

            return Favorites(
                favoriteFolderIns = listOf(folder1In, folder2In, folder3In),
                favoriteFolderIds = listOf(folder1Id, folder2Id, folder3Id),
                assignmentOuts = assignmentOuts,
                expectedFavoriteIds = FavoriteIdsDtoOut(
                    rootFolder = cardFolders.asFavoriteFolderDtoOut(),
                    folderIdsByAssignmentId = mapOf(
                        assignment1Out.id to listOf(folder1Id),
                        assignment2Out.id to listOf(ROOT_FOLDER_ID, folder2Id),
                    )
                ),
                expectedCardFolders = cardFolders
            )
        }

        @TestFactory
        @WithOpettajaRole
        fun `no own favorites`() = Exam.entries.map { exam ->
            dynamicTest("no own favorites $exam") {
                val folder1In = FavoriteFolderDtoIn("Folder 1", ROOT_FOLDER_ID)
                val folder1Id = createFavoriteFolder(exam, folder1In, yllapitajaUser)
                val assignment1Out: AssignmentOut = createAssignment(minimalAssignmentIn(exam), yllapitajaUser)
                setAssignmentFavoriteFolders(exam, assignment1Out.id, listOf(folder1Id), yllapitajaUser)

                val favoriteIds = getFavoriteIds(exam)
                assertThat(favoriteIds.rootFolder.asFavoriteFolderWithoutId()).isEqualTo(
                    FavoriteFolderWithoutId(
                        name = ROOT_FOLDER_NAME,
                        subfolders = emptyList()
                    )
                )
                assertThat(favoriteIds.folderIdsByAssignmentId).isEmpty()

                val cardFolders = getCardFolders(exam)
                assertThat(cardFolders.asFavoriteCardFolderWithoutId()).isEqualTo(
                    FavoriteCardFolderWithoutId(
                        ROOT_FOLDER_NAME,
                        emptyList(),
                        emptyList()
                    )
                )
            }
        }

        @TestFactory
        @WithOpettajaRole
        fun `favorites in nested folders`() = Exam.entries.map { exam ->
            dynamicTest("favorites in nested folders $exam") {
                val favorites = createSomeFavorites(exam)

                val favoriteIdsFromDb = getFavoriteIds(exam)
                assertThat(favoriteIdsFromDb.rootFolder.asFavoriteFolderWithoutId())
                    .isEqualTo(favorites.expectedFavoriteIds.rootFolder.asFavoriteFolderWithoutId())
                assertThat(favoriteIdsFromDb.folderIdsByAssignmentId)
                    .isEqualTo(favorites.expectedFavoriteIds.folderIdsByAssignmentId)

                val assignment2Id = favorites.assignmentOuts[1].id
                val favoriteIdsForAssignment2 = getFavoriteIdsForAssignment(exam, assignment2Id)
                assertThat(favoriteIdsForAssignment2.rootFolder.asFavoriteFolderWithoutId())
                    .isEqualTo(favorites.expectedFavoriteIds.rootFolder.asFavoriteFolderWithoutId())
                assertThat(favoriteIdsForAssignment2.folderIdsByAssignmentId)
                    .isEqualTo(favorites.expectedFavoriteIds.folderIdsByAssignmentId.filter { it.key == assignment2Id })

                val cardFoldersFromDb = getCardFolders(exam)

                assertThat(cardFoldersFromDb.asFavoriteCardFolderWithoutId())
                    .isEqualTo(favorites.expectedCardFolders.asFavoriteCardFolderWithoutId())
            }
        }

        @Test
        @WithOpettajaRole
        fun `non-existent assignmentId`() {
            val nonExistentAssignmentId = -1
            val favoriteIds = getFavoriteIdsForAssignment(Exam.SUKO, nonExistentAssignmentId)
            assertThat(favoriteIds.folderIdsByAssignmentId).isEmpty()
        }

        @Test
        @WithOpettajaRole
        fun `assignment has no favorites`() {
            val assignmentOut: AssignmentOut = createAssignment(minimalAssignmentIn(Exam.SUKO))
            val favoriteIds = getFavoriteIdsForAssignment(Exam.SUKO, assignmentOut.id)
            assertThat(favoriteIds.folderIdsByAssignmentId).isEmpty()
        }
    }

    @Nested
    @DisplayName("set assignment favorite folders")
    inner class SetAssignmentFavoriteFolders {
        private fun `create folder and assignment and add assignment to root and folder`(
            exam: Exam,
            user: RequestPostProcessor? = null
        ): Favorites {
            val folder1In = FavoriteFolderDtoIn("Folder 1", ROOT_FOLDER_ID)
            val folder1Id = createFavoriteFolder(exam, folder1In, user)

            val assignment1Out: AssignmentOut = createAssignment(minimalAssignmentIn(exam))

            setAssignmentFavoriteFolders(exam, assignment1Out.id, listOf(ROOT_FOLDER_ID, folder1Id), user)

            val assignmentOuts = listOf(assignment1Out)
            val cardFolders = FavoriteCardFolderDtoOut(
                -1,
                ROOT_FOLDER_NAME,
                listOf(
                    FavoriteCardFolderDtoOut(
                        -1,
                        folder1In.name,
                        emptyList(),
                        listOf(AssignmentCardOut.fromAssignmentOut(assignment1Out))
                    )
                ),
                listOf(AssignmentCardOut.fromAssignmentOut(assignment1Out))
            )

            return Favorites(
                favoriteFolderIns = listOf(folder1In),
                favoriteFolderIds = listOf(folder1Id),
                assignmentOuts = assignmentOuts,
                expectedFavoriteIds = FavoriteIdsDtoOut(
                    rootFolder = cardFolders.asFavoriteFolderDtoOut(),
                    folderIdsByAssignmentId = mapOf(
                        assignment1Out.id to listOf(ROOT_FOLDER_ID, folder1Id),
                    )
                ),
                expectedCardFolders = cardFolders
            )
        }

        @TestFactory
        @WithOpettajaRole
        fun `add assignment to two folders`() = Exam.entries.map { exam ->
            dynamicTest("add assignment to two folders $exam") {
                val favorites = `create folder and assignment and add assignment to root and folder`(exam)

                val favoriteIds = getFavoriteIds(exam)
                assertThat(favoriteIds.folderIdsByAssignmentId).isEqualTo(
                    favorites.expectedFavoriteIds.folderIdsByAssignmentId
                )
            }
        }

        @TestFactory
        @WithOpettajaRole
        fun `remove assignment from all folders`() = Exam.entries.map { exam ->
            dynamicTest("remove assignment from all folders $exam") {
                val favorites = `create folder and assignment and add assignment to root and folder`(exam)
                setAssignmentFavoriteFolders(exam, favorites.assignmentOuts[0].id, emptyList())
                val favoriteIds = getFavoriteIds(exam)
                assertThat(favoriteIds.folderIdsByAssignmentId).isEmpty()
            }
        }

        @TestFactory
        @WithOpettajaRole
        fun `remove assignment from one folder and add to two`() = Exam.entries.map { exam ->
            dynamicTest("remove assignment from one folder and add to two $exam") {
                val favorites = `create folder and assignment and add assignment to root and folder`(exam)

                val folder2In = FavoriteFolderDtoIn("Folder 2", favorites.favoriteFolderIds[0])
                val folder2Id = createFavoriteFolder(exam, folder2In)
                val folder3In = FavoriteFolderDtoIn("Folder 3", ROOT_FOLDER_ID)
                val folder3Id = createFavoriteFolder(exam, folder3In)

                setAssignmentFavoriteFolders(
                    exam,
                    favorites.assignmentOuts[0].id,
                    listOf(ROOT_FOLDER_ID, folder2Id, folder3Id)
                )
                val favoriteIds = getFavoriteIds(exam)
                assertThat(favoriteIds.folderIdsByAssignmentId).isEqualTo(
                    mapOf(
                        favorites.assignmentOuts[0].id to listOf(ROOT_FOLDER_ID, folder2Id, folder3Id)
                    )
                )
            }
        }

        @TestFactory
        fun `two different users do not affect each other`() = Exam.entries.map { exam ->
            dynamicTest("two different users do not affect each other $exam") {
                val opettajaFavorites =
                    `create folder and assignment and add assignment to root and folder`(exam, opettajaUser)
                val yllapitajaFavorites =
                    `create folder and assignment and add assignment to root and folder`(exam, yllapitajaUser)

                setAssignmentFavoriteFolders(
                    exam,
                    opettajaFavorites.assignmentOuts[0].id,
                    listOf(ROOT_FOLDER_ID),
                    opettajaUser
                )
                setAssignmentFavoriteFolders(
                    exam,
                    yllapitajaFavorites.assignmentOuts[0].id,
                    listOf(yllapitajaFavorites.favoriteFolderIds[0]),
                    yllapitajaUser
                )

                val opettajaFavoriteIds = getFavoriteIds(exam, opettajaUser)
                assertThat(opettajaFavoriteIds.folderIdsByAssignmentId).isEqualTo(
                    mapOf(
                        opettajaFavorites.assignmentOuts[0].id to listOf(ROOT_FOLDER_ID)
                    )
                )

                val yllapitajaFavoriteIds = getFavoriteIds(exam, yllapitajaUser)
                assertThat(yllapitajaFavoriteIds.folderIdsByAssignmentId).isEqualTo(
                    mapOf(
                        yllapitajaFavorites.assignmentOuts[0].id to listOf(yllapitajaFavorites.favoriteFolderIds[0])
                    )
                )
            }
        }

        @Test
        @WithOpettajaRole
        fun `non-existent assignmentId`() {
            val nonExistentAssignmentId = -1
            val errorMessage = performWithCsrf(
                setAssignmentFavoriteFoldersReq(
                    Exam.SUKO,
                    nonExistentAssignmentId,
                    mapper.writeValueAsString(listOf(ROOT_FOLDER_ID))
                )
            )
                .andExpect(status().isNotFound)
                .andReturn().response.contentAsString
            assertThat(errorMessage).isEqualTo("Assignment $nonExistentAssignmentId (${Exam.SUKO}) not found")
        }

        @Test
        @WithOpettajaRole
        fun `one of the folderIds does not exist`() {
            val yllapitajaFavorites =
                `create folder and assignment and add assignment to root and folder`(Exam.SUKO)

            val newFolderIdList = listOf(ROOT_FOLDER_ID, -1)
            val errorMessage = performWithCsrf(
                setAssignmentFavoriteFoldersReq(
                    Exam.SUKO,
                    yllapitajaFavorites.assignmentOuts[0].id,
                    mapper.writeValueAsString(newFolderIdList)
                )
            )
                .andExpect(status().isBadRequest)
                .andReturn().response.contentAsString

            assertThat(errorMessage).isEqualTo("At least one of the folder ids $newFolderIdList does not exist for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}")
        }

        @Test
        fun `someone else owns`() {
            val yllapitajaFavorites =
                `create folder and assignment and add assignment to root and folder`(Exam.SUKO, yllapitajaUser)

            val newFolderIdList = listOf(yllapitajaFavorites.favoriteFolderIds[0])
            val errorMessage = performWithCsrf(
                setAssignmentFavoriteFoldersReq(
                    Exam.SUKO,
                    yllapitajaFavorites.assignmentOuts[0].id,
                    mapper.writeValueAsString(newFolderIdList),
                    opettajaUser
                )
            )
                .andExpect(status().isBadRequest)
                .andReturn().response.contentAsString

            assertThat(errorMessage).isEqualTo("At least one of the folder ids $newFolderIdList does not exist for user ${OpettajaSecurityContextFactory().kayttajatiedot().oidHenkilo}")
        }
    }

    @Nested
    @DisplayName("get favorite count")
    inner class GetFavoriteCount {
        @Test
        @WithOpettajaRole
        fun `no favorites`() {
            assertThat(getTotalFavoriteCount()).isEqualTo(0)
        }

        @Test
        @WithOpettajaRole
        fun `one assignment in one folder counts as one favorite`() {
            val assignmentOut: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut.id, listOf(ROOT_FOLDER_ID))

            assertThat(getTotalFavoriteCount()).isEqualTo(1)
        }

        @Test
        @WithOpettajaRole
        fun `multiple versions of an assignment count as one favorite`() {
            val assignmentOut: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut.id, listOf(ROOT_FOLDER_ID))

            assertThat(getTotalFavoriteCount()).isEqualTo(1)

            val updatedAssignmentIn =
                TestSukoAssignmentDtoIn(SukoAssignmentDtoIn(assignmentOut)).copy(nameFi = assignmentOut.nameFi + " updated")
            createNewVersionOfAssignment(assignmentOut.id, updatedAssignmentIn)

            assertThat(getTotalFavoriteCount()).isEqualTo(1)
        }

        @Test
        @WithOpettajaRole
        fun `adding one assignment to two folders counts as two favorites`() {
            val folder1In = FavoriteFolderDtoIn("Folder 1", ROOT_FOLDER_ID)
            val folder1Id = createFavoriteFolder(Exam.SUKO, folder1In)

            val assignmentOut: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut.id, listOf(ROOT_FOLDER_ID, folder1Id))

            assertThat(getTotalFavoriteCount()).isEqualTo(2)
        }

        @Test
        @WithOpettajaRole
        fun `two assignments in one folder counts as two favorites`() {
            val assignmentOut1: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            val assignmentOut2: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut1.id, listOf(ROOT_FOLDER_ID))
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut2.id, listOf(ROOT_FOLDER_ID))

            assertThat(getTotalFavoriteCount()).isEqualTo(2)
        }

        @Test
        @WithOpettajaRole
        fun `two assignments in two different folders counts as two favorites`() {
            val folder1In = FavoriteFolderDtoIn("Folder 1", ROOT_FOLDER_ID)
            val folder1Id = createFavoriteFolder(Exam.SUKO, folder1In)

            val assignmentOut1: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            val assignmentOut2: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut1.id, listOf(ROOT_FOLDER_ID))
            setAssignmentFavoriteFolders(Exam.SUKO, assignmentOut2.id, listOf(folder1Id))

            assertThat(getTotalFavoriteCount()).isEqualTo(2)
        }

        @Test
        @WithYllapitajaRole
        fun `seed data yields expected favorite count`() {
            seedDbWithAssignments(mockMvc)
            assertThat(getTotalFavoriteCount()).isEqualTo(54)
        }
    }
}