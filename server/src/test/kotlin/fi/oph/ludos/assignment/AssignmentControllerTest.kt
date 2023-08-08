package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import org.apache.http.HttpStatus
import org.hamcrest.CoreMatchers.*
import org.hamcrest.MatcherAssert.assertThat
import org.hibernate.validator.internal.util.Contracts.assertTrue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.ZonedDateTime
import javax.transaction.Transactional
import kotlin.reflect.full.memberProperties

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentControllerTest(@Autowired val mockMvc: MockMvc) {
    val mapper = jacksonObjectMapper()
    var idsOfAssignmentDrafts = listOf<Int>()

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDb())
        mockMvc.perform(seedDb())
        val res = mockMvc.perform(getAllAssignments(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        idsOfAssignmentDrafts = mapper.readValue(res, Array<TestAssignmentSukoOut>::class.java)
            .filter { it.publishState == "DRAFT" }.map { it.id }
    }

    fun assertTimeIsBetween(before: ZonedDateTime, time: ZonedDateTime, after: ZonedDateTime, timeName: String) {
        assertTrue(time >= before && time <= after,
            "Time ${timeName} ${time} is not between ${before} and ${after}")
    }

    fun assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(sukoIn: TestAssignmentSukoIn, sukoOut: TestAssignmentSukoOut) {
        assertEquals(sukoIn.nameFi, sukoOut.nameFi)
        assertEquals(sukoIn.nameSv, sukoOut.nameSv)
        assertEquals(sukoIn.contentFi, sukoOut.contentFi)
        assertEquals(sukoIn.contentSv, sukoOut.contentSv)
        assertEquals(sukoIn.publishState, sukoOut.publishState)
        assertEquals(sukoIn.assignmentTypeKoodiArvo, sukoOut.assignmentTypeKoodiArvo)
        assertEquals(sukoIn.oppimaaraKoodiArvo, sukoOut.oppimaaraKoodiArvo)
        assertEquals(sukoIn.tavoitetasoKoodiArvo, sukoOut.tavoitetasoKoodiArvo)
        assertThat(sukoIn.aiheKoodiArvos, equalTo(sukoOut.aiheKoodiArvos))
        assertThat(
            sukoIn.laajaalainenOsaaminenKoodiArvos,
            equalTo(sukoOut.laajaalainenOsaaminenKoodiArvos)
        )
    }

    @Test
    @WithYllapitajaRole
    fun createAndGetByIdAndUpdateSukoAssignment() {
        val testAssignment = TestAssignmentSukoIn(
            "SUKO",
            "name fi",
            "name sv",
            "content fi",
            "content sv",
            "instruction fi",
            "instruction sv",
            "PUBLISHED",
            "003",
            "TKRUA1",
            "0004",
            arrayOf("002", "003"),
            arrayOf("06", "03")
        )

        val testAssignmentStr = mapper.writeValueAsString(testAssignment)
        val timeBeforeCreate = nowFromDb(mockMvc)
        val createResult = mockMvc.perform(postAssignment(testAssignmentStr)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val timeAfterCreate = nowFromDb(mockMvc)
        val createdAssignment = mapper.readValue(createResult, TestAssignmentSukoOut::class.java)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(testAssignment, createdAssignment)
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))
        assertTimeIsBetween(timeBeforeCreate, ZonedDateTime.parse(createdAssignment.createdAt), timeAfterCreate, "createdAt")
        assertEquals(createdAssignment.createdAt, createdAssignment.updatedAt)

        val getByIdStr = mockMvc.perform(getAssignment(Exam.SUKO, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = mapper.readValue(getByIdStr, TestAssignmentSukoOut::class.java)

        assertEquals(mapper.writeValueAsString(createdAssignment), mapper.writeValueAsString(assignmentById))

        // update request
        val updatedAssignment = TestAssignmentSukoIn(
            testAssignment.exam,
            "new name fi",
            "new name sv",
            "new content fi",
            "new content sv",
            "new instruction fi",
            "new instruction sv",
            "DRAFT",
            "001",
            "TKRUB3",
            "0010",
            arrayOf("002", "004"),
            arrayOf("04", "05")
        )
        val updatedAssignmentStr = mapper.writeValueAsString(updatedAssignment)
        val timeBeforeUpdate = nowFromDb(mockMvc)
        val updatedAssignmentId =
            mockMvc.perform(updateAssignment(assignmentById.id, updatedAssignmentStr)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertEquals(updatedAssignmentId, assignmentById.id.toString())

        val getUpdatedByIdStr = mockMvc.perform(getAssignment(Exam.SUKO, assignmentById.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val updatedAssignmentById = mapper.readValue(getUpdatedByIdStr, TestAssignmentSukoOut::class.java)

        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(updatedAssignment, updatedAssignmentById)
        assertEquals(createdAssignment.authorOid, updatedAssignmentById.authorOid)
        assertEquals(createdAssignment.createdAt, updatedAssignmentById.createdAt)
        assertTimeIsBetween(timeBeforeUpdate, ZonedDateTime.parse(updatedAssignmentById.updatedAt), timeAfterUpdate, "updatedAt")
    }

    val minimalSukoAssignmentIn = TestAssignmentSukoIn(
        "SUKO",
        "",
        "",
        "",
        "",
        "",
        "",
        "PUBLISHED",
        "003",
        "TKRUA1",
        null,
        emptyArray(),
        emptyArray(),
    )

    @Test
    @WithYllapitajaRole
    fun createMinimalSukoAssignment() {
        mockMvc.perform(postAssignment(mapper.writeValueAsString(minimalSukoAssignmentIn))).andExpect(status().isOk())
    }

    private fun removeField(jsonString:String, fieldToRemove: String): String =
        jsonString.replace(Regex("\"${fieldToRemove}\":[^,}]*[,}]"), "")

    @Test
    @WithYllapitajaRole
    fun anyMissingFieldYields400() {
        SukoAssignmentDtoIn::class.memberProperties.forEach { field ->
            val dtoInMap: Map<*,*> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
            val jsonWithFieldRemoved = mapper.writeValueAsString(dtoInMap - field.name)
            val response = mockMvc.perform(postAssignment(jsonWithFieldRemoved)).andReturn().response
            assertThat("missing ${field.name} yields bad request", response.status, equalTo(HttpStatus.SC_BAD_REQUEST))
            assertThat("missing ${field.name} yields proper error message",
                response.contentAsString, containsString("property ${field.name} due to missing"))
        }
    }

    @Test
    @WithYllapitajaRole
    fun missingExamFieldYields400() {
        val dtoInMap: Map<*,*> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
        val jsonWithExamRemoved = mapper.writeValueAsString(dtoInMap - "exam")
        val responseBody = mockMvc.perform(postAssignment(jsonWithExamRemoved)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody, containsString("missing type id property 'exam'"))
    }

    @Test
    @WithYllapitajaRole
    fun invalidExamFieldYields400() {
        val dtoInMap: Map<*,*> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
        val jsonWithExamRemoved = mapper.writeValueAsString(dtoInMap + ("exam" to "SCHUKO"))
        val responseBody = mockMvc.perform(postAssignment(jsonWithExamRemoved)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody, containsString("Could not resolve type id 'SCHUKO' as a subtype"))
    }

    @Test
    @WithYllapitajaRole
    fun invalidEnumFieldYields400() {
        val jsonWithInvalidPublishState = mapper.writeValueAsString(minimalSukoAssignmentIn.copy(publishState = "OLEMATON"))
        val responseBody = mockMvc.perform(postAssignment(jsonWithInvalidPublishState)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody, containsString("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"OLEMATON\": not one of the values accepted"))
    }

    @Test
    @WithYllapitajaRole
    fun sukoAssignmentUpdateFailsWhenIdDoesNotExist() {
        val nonExistentId = -1
        val errorMessage = mockMvc.perform(updateAssignment(nonExistentId, mapper.writeValueAsString(minimalSukoAssignmentIn)))
            .andExpect(status().isNotFound).andReturn().response.contentAsString
        assertThat(errorMessage, equalTo("Assignment not found $nonExistentId"))
    }

    @Test
    @WithYllapitajaRole
    fun failKoodistoValidation() {
        val assignmentWithInvalidKoodiArvos = minimalSukoAssignmentIn.copy(
            assignmentTypeKoodiArvo = "epavalidi",
            oppimaaraKoodiArvo = "epavalidi",
            tavoitetasoKoodiArvo = "epavalidi",
            aiheKoodiArvos = arrayOf("epavalidi1", "epavalidi2"),
            laajaalainenOsaaminenKoodiArvos = arrayOf("epavalidi3", "epavalidi4")
        )

        val errorMessage =
            mockMvc.perform(postAssignment(mapper.writeValueAsString(assignmentWithInvalidKoodiArvos)))
                .andExpect(status().isBadRequest).andReturn().response.contentAsString.trimIndent()

        assertThat(
            errorMessage, equalTo(
                """
                aiheKoodiArvos: Invalid KoodiArvos
                assignmentTypeKoodiArvo: Invalid KoodiArvo
                laajaalainenOsaaminenKoodiArvos: Invalid KoodiArvos
                oppimaaraKoodiArvo: Invalid KoodiArvo
                tavoitetasoKoodiArvo: Invalid KoodiArvo
            """.trimIndent()
            )
        )
    }

    @Test
    @WithYllapitajaRole
    fun ldAssignmentTest() {
        val testAssignment = """
            {
              "nameFi": "Lukiodiplomi assignment FI",
              "contentFi": "Lukiodiplomi assignment content FI",
              "instructionFi": "Lukiodiplomi assignment instruction FI",
              "nameSv": "Lukiodiplomi assignment SV",
              "contentSv": "Lukiodiplomi assignment content SV",
              "instructionSv": "Lukiodiplomi assignment instruction SV",
              "publishState": "PUBLISHED",
              "exam": "LD",
              "laajaalainenOsaaminenKoodiArvos": ["06", "03"],
              "lukuvuosiKoodiArvos": ["20202021", "20222023"],
              "aineKoodiArvo": "1"
            }
        """.trimIndent()

        // post assignment DTO IN
        val createResult = mockMvc.perform(postAssignment(testAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val createdAssignment = mapper.readValue(createResult, TestAssignmentLdOut::class.java)

        // get assignment DTO OUT
        val getByIdResult = mockMvc.perform(getAssignment(Exam.LD, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = mapper.readValue(getByIdResult, TestAssignmentLdOut::class.java)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Lukiodiplomi assignment FI")
        assertEquals(assignmentById.contentFi, "Lukiodiplomi assignment content FI")
        assertEquals(assignmentById.publishState, PublishState.PUBLISHED)
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "03")))
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))
        assertEquals(assignmentById.lukuvuosiKoodiArvos[0], "20202021")
        assertEquals(assignmentById.aineKoodiArvo, "1")

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentById.id}",
                "exam": "${Exam.LD}",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "${assignmentById.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentById.instructionSv}",
                "publishState": "PUBLISHED",
                "laajaalainenOsaaminenKoodiArvos": ["02"],
                "lukuvuosiKoodiArvos": ["20222023"],
                "aineKoodiArvo": "2"
            }"""

        mockMvc.perform(updateAssignment(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment = mockMvc.perform(getAssignment(Exam.LD, assignmentById.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val updatedAssignment = mapper.readValue(getUpdatedAssignment, TestAssignmentLdOut::class.java)

        assertEquals(updatedAssignment.nameFi, "New test name")
        assertEquals(updatedAssignment.contentFi, "content")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "New test name")
        assertEquals(updatedAssignment.contentSv, "content")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("02")))
        assertThat(createdAssignment.authorOid, equalTo(assignmentById.authorOid))
        assertThat(updatedAssignment.lukuvuosiKoodiArvos, equalTo(arrayOf("20222023")))
        assertEquals(updatedAssignment.aineKoodiArvo, "2")

    }

    @Test
    @WithYllapitajaRole
    fun puhviAssignmentTest() {
        val body = """
            {
                "nameFi": "Puhvi assignment",
                "nameSv": "Puhvi assignment",
                "contentFi": "Puhvi assignment content",
                "contentSv": "Puhvi assignment content",
                "instructionFi": "Puhvi assignment instruction",
                "instructionSv": "Puhvi assignment instruction",
                "publishState": "PUBLISHED",
                "exam": "PUHVI",
                "assignmentTypeKoodiArvo": "001",
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"],
                "lukuvuosiKoodiArvos": ["20222023"]
            }
        """

        // post assignment DTO IN
        val createResult =
            mockMvc.perform(postAssignment(body)).andExpect(status().isOk()).andReturn().response.contentAsString
        val createdAssignment = mapper.readValue(createResult, TestAssignmentPuhviOut::class.java)
        // get assignment DTO OUT
        val getByIdResult = mockMvc.perform(getAssignment(Exam.PUHVI, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = mapper.readValue(getByIdResult, TestAssignmentPuhviOut::class.java)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Puhvi assignment")
        assertEquals(assignmentById.nameSv, "Puhvi assignment")
        assertEquals(assignmentById.contentFi, "Puhvi assignment content")
        assertEquals(assignmentById.contentSv, "Puhvi assignment content")
        assertEquals(assignmentById.instructionFi, "Puhvi assignment instruction")
        assertEquals(assignmentById.instructionSv, "Puhvi assignment instruction")
        assertEquals(assignmentById.publishState, PublishState.PUBLISHED)
        assertThat(assignmentById.lukuvuosiKoodiArvos, equalTo(arrayOf("20222023")))
        assertEquals(assignmentById.assignmentTypeKoodiArvo, "001")
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "03")))
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentById.id}",
                "exam": "${Exam.PUHVI}",
                "nameFi": "Puhvi assignment edited",
                "nameSv": "Puhvi assignment edited",
                "contentFi": "Puhvi assignment content edited",
                "contentSv": "Puhvi assignment content edited",
                "instructionFi": "Puhvi assignment instruction",
                "instructionSv": "Puhvi assignment instruction",
                "publishState": "PUBLISHED",
                "exam": "PUHVI",
                "assignmentTypeKoodiArvo": "002",
                "laajaalainenOsaaminenKoodiArvos": ["06", "01"],
                "lukuvuosiKoodiArvos": ["20202021"]
            }"""

        mockMvc.perform(updateAssignment(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment =
            mockMvc.perform(getAssignment(Exam.PUHVI, assignmentById.id)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        val updatedAssignment = mapper.readValue(getUpdatedAssignment, TestAssignmentPuhviOut::class.java)

        assertEquals(updatedAssignment.nameFi, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentFi, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentSv, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertEquals(updatedAssignment.assignmentTypeKoodiArvo, "002")
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "01")))
        assertThat(updatedAssignment.authorOid, equalTo(assignmentById.authorOid))
        assertThat(updatedAssignment.lukuvuosiKoodiArvos, equalTo(arrayOf("20202021")))
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"PUBLISHED\",\"assignmentTypeKoodiArvo\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent, containsString("Could not resolve type id 'WRONG' as a subtype"))
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent, containsString("Cannot deserialize value of type"))
    }

    @Test
    @WithYllapitajaRole
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent, equalTo("Assignment not found 999"))
    }

    @Test
    fun getAssignmentsWithNoRole() {
        mockMvc.perform(getAllAssignments(Exam.SUKO)).andExpect(status().is3xxRedirection())
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentDraftAsOpettaja() {
        idsOfAssignmentDrafts.forEach() {
            mockMvc.perform(getAssignment(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentsAsOpettaja() {
        val res = mockMvc.perform(getAllAssignments(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val assignments = mapper.readValue(res, Array<TestAssignmentSukoOut>::class.java)

        assertTrue(
            assignments.none { it.publishState == "DRAFT" }, "Opettaja should not see draft assignments"
        )

        assertEquals(8, assignments.size)
    }

    @Test
    @WithOpettajaRole
    fun assignmentTestInsufficientRole() {
        val testAssignmentStr = """{
            "exam": "SUKO",
            "nameFi": "suomi",
            "nameSv": "ruotsi",
            "contentFi": "suomi",
            "contentSv": "ruotsi",
            "instructionFi": "suomi",
            "instructionSv": "ruotsi",
            "publishState": "PUBLISHED",
            "assignmentTypeKoodiArvo": "003",
            "oppimaaraKoodiArvo": "ET",
            "tavoitetasoKoodiArvo": "0004",
            "aiheKoodiArvos": ["002", "003"],
            "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
        }""".trimIndent()

        mockMvc.perform(postAssignment(testAssignmentStr)).andExpect(status().isUnauthorized())
        mockMvc.perform(updateAssignment(1, testAssignmentStr)).andExpect(status().isUnauthorized())
    }
}