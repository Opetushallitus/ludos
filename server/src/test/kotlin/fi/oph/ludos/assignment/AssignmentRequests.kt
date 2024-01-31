package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.TestPublishState
import fi.oph.ludos.yllapitajaUser
import org.assertj.core.api.AbstractStringAssert
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.util.UriComponentsBuilder
import kotlin.reflect.KClass

@AutoConfigureMockMvc
abstract class AssignmentRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    val minimalSukoAssignmentIn = TestSukoAssignmentDtoIn(
        "nameFi",
        "",
        "",
        "",
        listOf(""),
        listOf(""),
        TestPublishState.PUBLISHED,
        emptyList(),
        "003",
        Oppimaara("TKRUA1"),
        null,
        emptyList(),
    )

    val minimalLdAssignmentIn = TestLdAssignmentDtoIn(
        "nameFi",
        "",
        "",
        "",
        listOf(""),
        listOf(""),
        TestPublishState.PUBLISHED,
        emptyList(),
        listOf("20202021"),
        "1",
    )

    val minimalPuhviAssignmentIn = TestPuhviAssignmentDtoIn(
        "nameFi",
        "",
        "",
        "",
        listOf(""),
        listOf(""),
        TestPublishState.PUBLISHED,
        emptyList(),
        "001",
        listOf("20202021"),
        Exam.PUHVI.toString()
    )

    fun minimalAssignmentIn(exam: Exam) = when (exam) {
        Exam.SUKO -> minimalSukoAssignmentIn
        Exam.PUHVI -> minimalPuhviAssignmentIn
        Exam.LD -> minimalLdAssignmentIn
    }

    fun examByAssignmentOutClass(assignmentOutClass: KClass<out AssignmentOut>): Exam =
        when (assignmentOutClass) {
            SukoAssignmentDtoOut::class -> Exam.SUKO
            LdAssignmentDtoOut::class -> Exam.LD
            PuhviAssignmentDtoOut::class -> Exam.PUHVI
            else -> throw RuntimeException("unsupported AssignmentOutClass '$assignmentOutClass'")
        }

    fun examByAssignmentCardOutClass(assignmentCardOutClass: KClass<out AssignmentCardOut>): Exam =
        when (assignmentCardOutClass) {
            SukoAssignmentCardDtoOut::class -> Exam.SUKO
            LdAssignmentCardDtoOut::class -> Exam.LD
            PuhviAssignmentCardDtoOut::class -> Exam.PUHVI
            else -> throw RuntimeException("unsupported AssignmentOutClass '$assignmentCardOutClass'")
        }

    fun createAssignmentReq(body: String) =
        MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment").contentType(MediaType.APPLICATION_JSON)
            .content(body)

    inline fun <reified T : AssignmentOut> createAssignment(
        assignmentIn: TestAssignmentIn,
        user: RequestPostProcessor = yllapitajaUser
    ): T {
        val req = createAssignmentReq(mapper.writeValueAsString(assignmentIn)).with(user)

        val responseBody = mockMvc.perform(req).andExpect(status().isOk).andReturn().response.contentAsString
        return mapper.readValue(responseBody)
    }

    fun assertThatCreateInvalidAssignmentError(assignmentIn: TestAssignmentIn): AbstractStringAssert<*> {
        val errorMessage =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(assignmentIn)))
                .andExpect(status().isBadRequest).andReturn().response.contentAsString
        return assertThat(errorMessage)
    }

    fun getAssignmentsWithAnyFilterReq(exam: Exam, str: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam$str")
            .contentType(MediaType.APPLICATION_JSON)

    fun getAssignmentByIdReq(exam: Exam, id: Int, version: Int? = null): MockHttpServletRequestBuilder {
        val url = "${Constants.API_PREFIX}/assignment/$exam/$id" + if (version != null) "/$version" else ""
        return MockMvcRequestBuilders.get(url).contentType(MediaType.APPLICATION_JSON)
    }

    inline fun <reified T : AssignmentOut> getAssignmentById(
        id: Int,
        version: Int? = null,
        user: RequestPostProcessor? = null
    ): T {
        val exam = examByAssignmentOutClass(T::class)
        val builder = getAssignmentByIdReq(exam, id, version)

        if (user != null) {
            builder.with(user)
        }

        val getUpdatedByIdStr = mockMvc.perform(builder).andExpect(status().isOk()).andReturn().response.contentAsString

        return mapper.readValue(getUpdatedByIdStr)
    }

    fun updateAssignmentReq(id: Int, body: String) =
        MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$id").contentType(MediaType.APPLICATION_JSON)
            .content(body)

    fun updateAssignment(
        id: Int,
        testAssignmentIn: TestAssignmentIn,
        user: RequestPostProcessor = yllapitajaUser
    ): String {
        val builder = updateAssignmentReq(id, mapper.writeValueAsString(testAssignmentIn)).with(user)

        return mockMvc.perform(builder).andExpect(status().isOk()).andReturn().response.contentAsString
    }

    fun getAllAssignmentsReq(exam: Exam) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam").contentType(MediaType.APPLICATION_JSON)


    inline fun <reified T : AssignmentCardOut> getAllAssignmentsForExam(): TestAssignmentsOut<T> {
        val exam = examByAssignmentCardOutClass(T::class)

        val responseContent =
            mockMvc.perform(getAllAssignmentsReq(exam)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        return mapper.readValue<TestAssignmentsOut<T>>(responseContent)
    }

    fun getAllAssignmentVersionsReq(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam/$id/versions")
            .contentType(MediaType.APPLICATION_JSON)

    inline fun <reified T : AssignmentOut> getAllAssignmentVersions(id: Int): List<T> {
        val exam = examByAssignmentOutClass(T::class)

        val responseContent =
            mockMvc.perform(getAllAssignmentVersionsReq(exam, id)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        return mapper.readValue<List<T>>(responseContent)
    }

    private fun getSukoAssignmentsReq(filter: SukoFilters): MockHttpServletRequestBuilder {
        val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/${Exam.SUKO}")

        filter.jarjesta?.let { uriBuilder.queryParam("jarjesta", it) }
        filter.oppimaara?.let { uriBuilder.queryParam("oppimaara", it) }
        filter.tehtavatyyppisuko?.let { uriBuilder.queryParam("tehtavatyyppisuko", it) }
        filter.aihe?.let { uriBuilder.queryParam("aihe", it) }
        filter.tavoitetaitotaso?.let { uriBuilder.queryParam("tavoitetaitotaso", it) }
        filter.sivu.let { uriBuilder.queryParam("sivu", it) }

        return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
    }

    fun getSukoAssignments(
        filter: SukoFilters,
    ): TestAssignmentsOut<SukoAssignmentCardDtoOut> = mapper.readValue(
        mockMvc.perform(getSukoAssignmentsReq(filter)).andExpect(status().isOk()).andReturn().response.contentAsString
    )

    private fun getPuhviAssignmentsReq(filter: PuhviFilters): MockHttpServletRequestBuilder {
        val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/${Exam.PUHVI}")

        filter.jarjesta?.let { uriBuilder.queryParam("jarjesta", it) }
        filter.tehtavatyyppipuhvi?.let { uriBuilder.queryParam("tehtavatyyppipuhvi", it) }
        filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }
        filter.sivu.let { uriBuilder.queryParam("sivu", it) }

        return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
    }

    fun getPuhviAssignments(filter: PuhviFilters): TestAssignmentsOut<PuhviAssignmentCardDtoOut> {
        val assignmentsString = mockMvc.perform(getPuhviAssignmentsReq(filter))
            .andExpect(status().isOk())
            .andReturn().response.contentAsString

        return mapper.readValue(assignmentsString)
    }

    private fun getLdAssignmentsReq(filter: LdFilters): MockHttpServletRequestBuilder {
        val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/${Exam.LD}")

        filter.jarjesta?.let { uriBuilder.queryParam("jarjesta", it) }
        filter.aine?.let { uriBuilder.queryParam("aine", it) }
        filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }
        filter.sivu.let { uriBuilder.queryParam("sivu", it) }

        return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
    }

    fun getLdAssignments(filter: LdFilters): TestAssignmentsOut<LdAssignmentCardDtoOut> {
        val assignmentsString = mockMvc.perform(getLdAssignmentsReq(filter))
            .andExpect(status().isOk())
            .andReturn().response.contentAsString

        return mapper.readValue(assignmentsString)
    }

    fun createFavoriteFolderReq(exam: Exam, body: String) =
        MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment/favorites/$exam/folder")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)

    fun createFavoriteFolder(exam: Exam, folder: FavoriteFolderDtoIn, user: RequestPostProcessor? = null): Int {
        val builder = createFavoriteFolderReq(exam, mapper.writeValueAsString(folder))
        if (user != null) {
            builder.with(user)
        }

        return mockMvc.perform(builder).andExpect(status().isOk())
            .andReturn().response.contentAsString.toInt()
    }

    fun updateFavoriteFolderReq(exam: Exam, folderId: Int, body: String) =
        MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/favorites/$exam/folder/$folderId")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)

    fun updateFavoriteFolder(
        exam: Exam,
        folderId: Int,
        folder: FavoriteFolderDtoIn,
        user: RequestPostProcessor? = null
    ) {
        val builder = updateFavoriteFolderReq(exam, folderId, mapper.writeValueAsString(folder))
        if (user != null) {
            builder.with(user)
        }

        mockMvc.perform(builder).andExpect(status().isOk())
    }

    fun deleteFavoriteFolderReq(exam: Exam, folderId: Int) =
        MockMvcRequestBuilders.delete("${Constants.API_PREFIX}/assignment/favorites/$exam/folder/$folderId")
            .contentType(MediaType.APPLICATION_JSON)

    fun deleteFavoriteFolder(exam: Exam, folderId: Int, user: RequestPostProcessor? = null) {
        val builder = deleteFavoriteFolderReq(exam, folderId)
        if (user != null) {
            builder.with(user)
        }

        mockMvc.perform(builder).andExpect(status().isOk())
    }

    fun getFavoriteIdsReq(exam: Exam, user: RequestPostProcessor? = null) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/favorites/$exam")
            .contentType(MediaType.APPLICATION_JSON)
            .let { if (user != null) it.with(user) else it }

    fun getFavoriteIds(exam: Exam, user: RequestPostProcessor? = null): FavoriteIdsDtoOut {
        val builder = getFavoriteIdsReq(exam, user)

        return mapper.readValue(
            mockMvc.perform(builder).andExpect(status().isOk())
                .andReturn().response.contentAsString
        )
    }

    fun getFavoriteIdsForAssignmentReq(exam: Exam, assignmentId: Int, user: RequestPostProcessor? = null) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/favorites/$exam/$assignmentId")
            .contentType(MediaType.APPLICATION_JSON)
            .let { if (user != null) it.with(user) else it }

    fun getFavoriteIdsForAssignment(
        exam: Exam,
        assignmentId: Int,
        user: RequestPostProcessor? = null
    ): FavoriteIdsDtoOut {
        val builder = getFavoriteIdsForAssignmentReq(exam, assignmentId, user)

        return mapper.readValue(
            mockMvc.perform(builder).andExpect(status().isOk())
                .andReturn().response.contentAsString
        )
    }

    fun getCardFoldersReq(exam: Exam, user: RequestPostProcessor? = null) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/favorites/$exam/cardFolders")
            .contentType(MediaType.APPLICATION_JSON)
            .let { if (user != null) it.with(user) else it }

    fun getCardFolders(exam: Exam, user: RequestPostProcessor? = null): FavoriteCardFolderDtoOut {
        val builder = getCardFoldersReq(exam, user)

        return mapper.readValue(
            mockMvc.perform(builder).andExpect(status().isOk())
                .andReturn().response.contentAsString
        )
    }

    fun setAssignmentFavoriteFoldersReq(
        exam: Exam,
        assignmentId: Int,
        body: String,
        user: RequestPostProcessor? = null
    ) =
        MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/favorites/$exam/$assignmentId")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)
            .let { if (user != null) it.with(user) else it }

    fun setAssignmentFavoriteFolders(
        exam: Exam,
        assignmentId: Int,
        folderIds: List<Int>,
        user: RequestPostProcessor? = null
    ): Int? {
        val builder = setAssignmentFavoriteFoldersReq(exam, assignmentId, mapper.writeValueAsString(folderIds), user)

        return mockMvc.perform(builder).andExpect(status().isOk())
            .andReturn().response.contentAsString.toIntOrNull()
    }

    fun getTotalFavoriteCount(user: RequestPostProcessor? = null): Int {
        val builder = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/favorites/count")

        if (user != null) {
            builder.with(user)
        }

        return mockMvc.perform(builder.contentType(MediaType.APPLICATION_JSON)).andExpect(status().isOk())
            .andReturn().response.contentAsString.toInt()
    }
}