package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
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
    MockMvcRequestBuilders.post("/api/assignment/").contentType(MediaType.APPLICATION_JSON).content(body)

fun getAssignment(examType: ExamType, id: Int) =
    MockMvcRequestBuilders.get("/api/assignment/$examType/$id").contentType(MediaType.APPLICATION_JSON)

fun updateAssignment(examType: ExamType, id: Int, body: String) =
    MockMvcRequestBuilders.put("/api/assignment/$examType/$id").contentType(MediaType.APPLICATION_JSON).content(body)

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiTests(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestSukoIn(
        val name: String,
        val content: String,
        val state: AssignmentState,
        val assignmentType: String,
        val examType: ExamType
    )

    data class TestSukoOut(
        val id: Int,
        val name: String,
        val content: String,
        val state: AssignmentState,
        val assignmentType: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun sukoAssignmentTest() {
        val testAssignment = TestSukoIn(
            name = "Suko Test Assignment",
            content = "Suko assignment content",
            state = AssignmentState.PUBLISHED,
            assignmentType = SukoAssignmentType.LUKEMINEN.toString(),
            examType = ExamType.SUKO
        )

        val testAssignmentToString: String = objectMapper.writeValueAsString(testAssignment)
        // post assignment DTO IN
        val postResult = mockMvc.perform(postAssignment(testAssignmentToString)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestSukoOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(ExamType.SUKO, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestSukoOut::class.java)

        assertEquals(assignmentOut.name, testAssignment.name)
        assertEquals(assignmentOut.content, testAssignment.content)
        assertEquals(assignmentOut.state, testAssignment.state)
        assertEquals(assignmentOut.assignmentType, testAssignment.assignmentType)

        // update request
        val editedAssignment =
            "{\"id\": \"${assignmentOut.id}\",\"name\":\"New test name\",\"content\":\"${assignmentOut.content}\",\"state\":\"PUBLISHED\",\"assignmentType\": \"${SukoAssignmentType.LUKEMINEN}\"}\n"

        val updatedAssignmentId = mockMvc.perform(updateAssignment(ExamType.SUKO, assignmentOut.id, editedAssignment))
            .andExpect(status().isOk()).andReturn().response.contentAsString

        assertEquals(updatedAssignmentId, assignmentOut.id.toString())
    }

    @Test
    fun failSukoUpdate() {
        val nonExistentId = -1
        val editedAssignmentFail =
            "{\"id\": \"$nonExistentId\",\"name\":\"New test name\",\"content\":\"content\",\"state\":\"PUBLISHED\",\"assignmentType\": \"${SukoAssignmentType.LUKEMINEN}\"}\n"

        val failUpdate = mockMvc.perform(updateAssignment(ExamType.SUKO, nonExistentId, editedAssignmentFail))
            .andReturn().response.contentAsString

        assertThat(failUpdate).isEqualTo("404 NOT_FOUND \"Assignment not found $nonExistentId\"")
    }

    data class TestLdOut(
        val id: Int,
        val name: String,
        val content: String,
        val state: AssignmentState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    data class TestLdIn(
        val name: String, val content: String, val state: AssignmentState, val examType: ExamType
    )

    @Test
    fun ldAssignmentTest() {
        val testAssignment = TestLdIn(
            name = "Lukiodiplomi assignment",
            content = "Lukiodiplomi assignment content",
            state = AssignmentState.PUBLISHED,
            ExamType.LD
        )

        val testAssignmentToString: String = objectMapper.writeValueAsString(testAssignment)

        // post assignment DTO IN
        val postResult = mockMvc.perform(postAssignment(testAssignmentToString)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestLdOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(ExamType.LD, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.name, testAssignment.name)
        assertEquals(assignmentOut.content, testAssignment.content)
        assertEquals(assignmentOut.state, testAssignment.state)
    }

    data class TestPuhviOut(
        val id: Int,
        val name: String,
        val content: String,
        val state: AssignmentState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun puhviAssignmentTest() {
        val body =
            "{\"name\":\"Puhvi assignment\",\"content\":\"Puhvi assignment content\",\"state\":\"PUBLISHED\",\"examType\":\"PUHVI\"}\n"
        // post assignment DTO IN
        val postResult =
            mockMvc.perform(postAssignment(body)).andExpect(status().isOk()).andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestPuhviOut::class.java)
        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(ExamType.PUHVI, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestPuhviOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.name, "Puhvi assignment")
        assertEquals(assignmentOut.content, "Puhvi assignment content")
        assertEquals(assignmentOut.state, AssignmentState.PUBLISHED)
    }

    @Test
    fun invalidExamType() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"state\":\"PUBLISHED\",\"assignmentType\":\"LUKEMINEN\",\"examType\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"state\":\"TEST\",\"examType\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getAssignment(ExamType.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("404 NOT_FOUND \"Assignment not found 999\"")
    }

}