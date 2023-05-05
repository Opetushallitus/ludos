package fi.oph.ludos.instruction

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.State
import fi.oph.ludos.Exam
import fi.oph.ludos.ExamType
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

fun updateInstruction(exam: Exam, id: Int, body: String) =
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

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postAssignment(testInstructionStr)).andExpect(status().isOk)
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

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Suko Test Instruction FI updated\",\"contentFi\":\"Suko Instruction content Fi updated\",\"nameSv\":\"Suko Test Instruction SV updated\",\"contentSv\":\"Suko Instruction content Sv updated\",\"state\":\"PUBLISHED\",\"examType\":\"${ExamType.INSTRUCTIONS}\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(Exam.SUKO, instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getAssignment(Exam.SUKO, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestSukoOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Suko Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Suko Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Suko Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Suko Instruction content Sv updated")
        assertEquals(updatedInstruction.state, State.PUBLISHED)
        assertEquals(updatedInstruction.examType, ExamType.INSTRUCTIONS)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }

    data class TestPuhviIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val exam: Exam
    )

    data class TestPuhviOut(
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
    fun puhviInstructionTest() {
        val testInstruction = TestPuhviIn(
            nameFi = "Puhvi Test Instruction FI",
            nameSv = "Puhvi Test Instruction SV",
            contentFi = "Puhvi Instruction content Fi",
            contentSv = "Puhvi Instruction content Sv",
            state = State.PUBLISHED,
            examType = ExamType.INSTRUCTIONS,
            exam = Exam.PUHVI
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postAssignment(testInstructionStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestPuhviOut::class.java)

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
            mockMvc.perform(getAssignment(Exam.PUHVI, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestPuhviOut::class.java)

        assertEquals(instructionIn, instructionOut)

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Puhvi Test Instruction FI updated\",\"contentFi\":\"Puhvi Instruction content Fi updated\",\"nameSv\":\"Puhvi Test Instruction SV updated\",\"contentSv\":\"Puhvi Instruction content Sv updated\",\"state\":\"PUBLISHED\",\"examType\":\"${ExamType.INSTRUCTIONS}\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(Exam.PUHVI, instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getAssignment(Exam.PUHVI, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestPuhviOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Puhvi Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Puhvi Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Puhvi Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Puhvi Instruction content Sv updated")
        assertEquals(updatedInstruction.state, State.PUBLISHED)
        assertEquals(updatedInstruction.examType, ExamType.INSTRUCTIONS)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }

    data class TestLdIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val state: State,
        val examType: ExamType,
        val exam: Exam
    )

    data class TestLdOut(
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
    fun ldInstructionTest() {
        val testInstruction = TestLdIn(
            nameFi = "Ld Test Instruction FI",
            nameSv = "Ld Test Instruction SV",
            contentFi = "Ld Instruction content Fi",
            contentSv = "Ld Instruction content Sv",
            state = State.PUBLISHED,
            examType = ExamType.INSTRUCTIONS,
            exam = Exam.LD
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postAssignment(testInstructionStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestLdOut::class.java)

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
            mockMvc.perform(getAssignment(Exam.LD, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(instructionIn, instructionOut)

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Ld Test Instruction FI updated\",\"contentFi\":\"Ld Instruction content Fi updated\",\"nameSv\":\"Ld Test Instruction SV updated\",\"contentSv\":\"Ld Instruction content Sv updated\",\"state\":\"PUBLISHED\",\"examType\":\"${ExamType.INSTRUCTIONS}\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(Exam.LD, instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getAssignment(Exam.LD, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestLdOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Ld Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Ld Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Ld Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Ld Instruction content Sv updated")
        assertEquals(updatedInstruction.state, State.PUBLISHED)
        assertEquals(updatedInstruction.examType, ExamType.INSTRUCTIONS)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }
}