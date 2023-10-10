package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.assertj.core.api.AbstractStringAssert
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import org.springframework.web.util.UriComponentsBuilder
import kotlin.reflect.KClass

@AutoConfigureMockMvc
abstract class AssignmentRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    fun examByTestAssignmentOutClass(testAssignmentOutClass: KClass<out AssignmentOut>): Exam =
        when (testAssignmentOutClass) {
            SukoAssignmentDtoOut::class -> Exam.SUKO
            LdAssignmentDtoOut::class -> Exam.LD
            PuhviAssignmentDtoOut::class -> Exam.PUHVI
            else -> throw RuntimeException("unsupported AssignmentOutClass '$testAssignmentOutClass'")
        }

    fun createAssignmentReq(body: String) =
        MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment").contentType(MediaType.APPLICATION_JSON)
            .content(body)

    inline fun <reified T : AssignmentOut> createAssignment(assignmentIn: TestAssignmentIn): T {
        val responseBody =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(assignmentIn)))
                .andExpect(MockMvcResultMatchers.status().isOk).andReturn().response.contentAsString
        return mapper.readValue(responseBody)
    }

    fun assertThatCreateInvalidAssignmentError(assignmentIn: TestAssignmentIn): AbstractStringAssert<*> {
        val errorMessage =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(assignmentIn)))
                .andExpect(MockMvcResultMatchers.status().isBadRequest).andReturn().response.contentAsString
        return assertThat(errorMessage)
    }

    fun getAssignmentsWithAnyFilterReq(exam: Exam, str: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam$str")
            .contentType(MediaType.APPLICATION_JSON)

    fun getAssignmentByIdReq(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam/$id")
            .contentType(MediaType.APPLICATION_JSON)

    inline fun <reified T : AssignmentOut> getAssignmentById(id: Int): T {
        val exam = examByTestAssignmentOutClass(T::class)
        val getUpdatedByIdStr = mockMvc.perform(getAssignmentByIdReq(exam, id)).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString
        return mapper.readValue(getUpdatedByIdStr)
    }

    fun updateAssignmentReq(id: Int, body: String) =
        MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$id").contentType(MediaType.APPLICATION_JSON)
            .content(body)

    fun getAllAssignmentsReq(exam: Exam) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam").contentType(MediaType.APPLICATION_JSON)

    inline fun <reified T : AssignmentOut> getAllAssignmentsForExam(): TestAssignmentsOut<T> {
        val exam = examByTestAssignmentOutClass(T::class)
        val responseContent =
            mockMvc.perform(getAllAssignmentsReq(exam)).andExpect(MockMvcResultMatchers.status().isOk())
                .andReturn().response.contentAsString
        return mapper.readValue<TestAssignmentsOut<T>>(responseContent)
    }

    private fun getSukoAssignmentsReq(filter: SukoFilters): MockHttpServletRequestBuilder {
        val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/${Exam.SUKO}")

        filter.jarjesta?.let { uriBuilder.queryParam("jarjesta", it) }
        filter.oppimaara?.let { uriBuilder.queryParam("oppimaara", it) }
        filter.tehtavatyyppisuko?.let { uriBuilder.queryParam("tehtavatyyppisuko", it) }
        filter.aihe?.let { uriBuilder.queryParam("aihe", it) }
        filter.tavoitetaitotaso?.let { uriBuilder.queryParam("tavoitetaitotaso", it) }
        filter.suosikki?.let { uriBuilder.queryParam("suosikki", it) }
        filter.sivu.let { uriBuilder.queryParam("sivu", it) }

        return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
    }

    fun getSukoAssignments(filter: SukoFilters): TestAssignmentsOut<SukoAssignmentDtoOut> {
        val assignmentsString = mockMvc.perform(getSukoAssignmentsReq(filter))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andReturn().response.contentAsString

        return mapper.readValue(assignmentsString)
    }

    private fun getPuhviAssignmentsReq(filter: PuhviFilters): MockHttpServletRequestBuilder {
        val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/${Exam.PUHVI}")

        filter.jarjesta?.let { uriBuilder.queryParam("jarjesta", it) }
        filter.tehtavatyyppipuhvi?.let { uriBuilder.queryParam("tehtavatyyppipuhvi", it) }
        filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }
        filter.sivu.let { uriBuilder.queryParam("sivu", it) }

        return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
    }

    fun getPuhviAssignments(filter: PuhviFilters): TestAssignmentsOut<PuhviAssignmentDtoOut> {
        val assignmentsString = mockMvc.perform(getPuhviAssignmentsReq(filter))
            .andExpect(MockMvcResultMatchers.status().isOk())
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

    fun getLdAssignments(filter: LdFilters): TestAssignmentsOut<LdAssignmentDtoOut> {
        val assignmentsString = mockMvc.perform(getLdAssignmentsReq(filter))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andReturn().response.contentAsString

        return mapper.readValue(assignmentsString)
    }

    fun setAssignmentIsFavoriteReq(exam: Exam, id: Int, isFavorite: Boolean) =
        MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$exam/$id/favorite")
            .content("{\"suosikki\": $isFavorite}")
            .contentType(MediaType.APPLICATION_JSON)

    fun setAssignmentIsFavorite(exam: Exam, id: Int, isFavorite: Boolean): Int =
        mockMvc.perform(setAssignmentIsFavoriteReq(exam, id, isFavorite))
            .andExpect(MockMvcResultMatchers.status().isOk()).andReturn().response.contentAsString.toInt()

    private fun getTotalFavoriteCountReq() =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/favoriteCount")
            .contentType(MediaType.APPLICATION_JSON)

    fun getTotalFavoriteCount(): Int =
        mockMvc.perform(getTotalFavoriteCountReq()).andExpect(MockMvcResultMatchers.status().isOk())
            .andReturn().response.contentAsString.toInt()
}