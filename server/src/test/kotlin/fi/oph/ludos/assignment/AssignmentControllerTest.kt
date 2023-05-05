package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.ExamType
import fi.oph.ludos.State
import javax.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.sql.Timestamp

fun postAssignment(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getAssignment(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateAssignment(exam: Exam, id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$exam/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssignmentControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestSukoIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val assignmentType: String,
        val exam: Exam
    )

    data class TestSukoOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val examType: ExamType,
        val state: State,
        val assignmentType: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun sukoAssignmentTest() {
        val testAssignment = TestSukoIn(
            nameFi = "Suko Test Assignment FI",
            nameSv = "Suko Test Assignment SV",
            contentFi = "Suko assignment content Fi",
            contentSv = "Suko assignment content Sv",
            state = State.PUBLISHED,
            examType = ExamType.ASSIGNMENTS,
            assignmentType = SukoAssignmentType.LUKEMINEN.toString(),
            exam = Exam.SUKO
        )

        val testAssignmentToString: String = objectMapper.writeValueAsString(testAssignment)
        // post assignment DTO IN
        val postResult = mockMvc.perform(postAssignment(testAssignmentToString)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestSukoOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestSukoOut::class.java)

        assertEquals(assignmentIn, assignmentOut)

        // update request
        val editedAssignment =
            "{\"id\": \"${assignmentOut.id}\",\"nameFi\":\"New test name\",\"contentFi\":\"${assignmentOut.contentFi}\",\"nameSv\":\"New test name\",\"contentSv\":\"content\",\"state\":\"PUBLISHED\",\"examType\":\"${ExamType.CERTIFICATES}\",\"assignmentType\": \"${SukoAssignmentType.LUKEMINEN}\"}\n"

        val updatedAssignmentId =
            mockMvc.perform(updateAssignment(Exam.SUKO, assignmentOut.id, editedAssignment)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        assertEquals(updatedAssignmentId, assignmentOut.id.toString())
    }

    @Test
    fun failSukoUpdate() {
        val nonExistentId = -1
        val editedAssignmentFail =
            "{\"id\": \"$nonExistentId\",\"nameFi\":\"New test name\",\"contentFi\":\"content\",\"nameSv\":\"New test name\",\"contentSv\":\"content\",\"state\":\"PUBLISHED\",\"examType\": \"${ExamType.INSTRUCTIONS}\",\"assignmentType\": \"${SukoAssignmentType.LUKEMINEN}\"}\n"

        val failUpdate = mockMvc.perform(updateAssignment(Exam.SUKO, nonExistentId, editedAssignmentFail))
            .andReturn().response.contentAsString

        assertThat(failUpdate).isEqualTo("404 NOT_FOUND \"Assignment not found $nonExistentId\"")
    }

    data class TestLdOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    data class TestLdIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val exam: Exam
    )

    @Test
    fun ldAssignmentTest() {
        val testAssignment = TestLdIn(
            nameFi = "Lukiodiplomi assignment FI",
            contentFi = "Lukiodiplomi assignment content FI",
            nameSv = "Lukiodiplomi assignment SV",
            contentSv = "Lukiodiplomi assignment content SV",
            state = State.PUBLISHED,
            examType = ExamType.ASSIGNMENTS,
            exam = Exam.LD
        )

        val testAssignmentToString: String = objectMapper.writeValueAsString(testAssignment)

        // post assignment DTO IN
        val postResult = mockMvc.perform(postAssignment(testAssignmentToString)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestLdOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.LD, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.nameFi, testAssignment.nameFi)
        assertEquals(assignmentOut.contentFi, testAssignment.contentFi)
        assertEquals(assignmentOut.state, testAssignment.state)
    }

    data class TestPuhviOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun puhviAssignmentTest() {
        val body =
            "{\"nameFi\":\"Puhvi assignment\",\"nameSv\":\"Puhvi assignment\",\"contentFi\":\"Puhvi assignment content\",\"contentSv\":\"Puhvi assignment content\",\"state\":\"PUBLISHED\",\"examType\":\"${ExamType.ASSIGNMENTS}\",\"exam\":\"PUHVI\"}\n"
        // post assignment DTO IN
        val postResult =
            mockMvc.perform(postAssignment(body)).andExpect(status().isOk()).andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestPuhviOut::class.java)
        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.PUHVI, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestPuhviOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.nameFi, "Puhvi assignment")
        assertEquals(assignmentOut.nameSv, "Puhvi assignment")
        assertEquals(assignmentOut.contentFi, "Puhvi assignment content")
        assertEquals(assignmentOut.contentSv, "Puhvi assignment content")
        assertEquals(assignmentOut.state, State.PUBLISHED)
    }

    @Test
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"state\":\"PUBLISHED\",\"examType\": \"${ExamType.CERTIFICATES}\",\"assignmentType\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"state\":\"TEST\",\"examType\": \"${ExamType.ASSIGNMENTS}\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("404 NOT_FOUND \"Assignment not found 999\"")
    }

}