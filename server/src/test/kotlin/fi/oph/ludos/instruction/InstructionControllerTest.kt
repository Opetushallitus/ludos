package fi.oph.ludos.instruction

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.State
import fi.oph.ludos.assignment.Exam
import fi.oph.ludos.assignment.ExamType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.sql.Timestamp
import javax.transaction.Transactional

fun postAssignment(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/instruction").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getAssignment(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateAssignment(exam: Exam, id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InstructionControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestSukoIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
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
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun sukoInstructionTest() {
        val testInstruction = TestSukoIn(
            nameFi = "Suko Test Instruction FI",
            nameSv = "Suko Test Instruction SV",
            contentFi = "Suko Instruction content Fi",
            contentSv = "Suko Instruction content Sv",
            state = State.PUBLISHED,
            examType = ExamType.INSTRUCTIONS,
            exam = Exam.SUKO
        )

        val asStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postAssignment(asStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestSukoOut::class.java)

        assertEquals(testInstruction.nameFi, instructionIn.nameFi)
        assertEquals(testInstruction.nameSv, instructionIn.nameSv)
        assertEquals(testInstruction.contentFi, instructionIn.contentFi)
        assertEquals(testInstruction.contentSv, instructionIn.contentSv)
        assertEquals(testInstruction.state, instructionIn.state)
        assertEquals(testInstruction.examType, instructionIn.examType)
        assertNotNull(instructionIn.id)
        assertNotNull(instructionIn.createdAt)
        assertNotNull(instructionIn.updatedAt)

        val getResult =
            mockMvc.perform(getAssignment(Exam.SUKO, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestSukoOut::class.java)

        assertEquals(instructionIn, instructionOut)
    }
}