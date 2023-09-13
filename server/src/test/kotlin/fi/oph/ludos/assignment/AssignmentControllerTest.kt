package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.apache.http.HttpStatus
import org.assertj.core.api.Assertions.assertThat
import org.hibernate.validator.internal.util.Contracts.assertTrue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import kotlin.reflect.full.memberProperties

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentControllerTest : AssignmentRequests() {
    var idsOfAssignmentDrafts = listOf<Int>()

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDb())
        mockMvc.perform(seedDbWithAssignments())
        idsOfAssignmentDrafts = getAllAssignmentsForExam<TestSukoAssignmentDtoOut>()
            .filter { it.publishState == TestPublishState.DRAFT }
            .map { it.id }
    }

    fun assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(
        sukoIn: TestSukoAssignmentDtoIn, sukoOut: TestSukoAssignmentDtoOut
    ) {
        assertEquals(sukoIn.nameFi, sukoOut.nameFi)
        assertEquals(sukoIn.nameSv, sukoOut.nameSv)
        assertEquals(sukoIn.contentFi, sukoOut.contentFi)
        assertEquals(sukoIn.contentSv, sukoOut.contentSv)
        assertEquals(sukoIn.publishState, sukoOut.publishState)
        assertEquals(sukoIn.assignmentTypeKoodiArvo, sukoOut.assignmentTypeKoodiArvo)
        assertEquals(sukoIn.oppimaaraKoodiArvo, sukoOut.oppimaaraKoodiArvo)
        assertEquals(sukoIn.tavoitetasoKoodiArvo, sukoOut.tavoitetasoKoodiArvo)
        assertThat(sukoIn.aiheKoodiArvos).isEqualTo(sukoOut.aiheKoodiArvos)
        assertThat(sukoIn.laajaalainenOsaaminenKoodiArvos).isEqualTo(sukoOut.laajaalainenOsaaminenKoodiArvos)
    }

    @Test
    @WithYllapitajaRole
    fun createAndGetByIdAndUpdateSukoAssignment() {
        val testAssignment = TestSukoAssignmentDtoIn(
            "SUKO",
            "name fi",
            "name sv",
            "content fi",
            "content sv",
            "instruction fi",
            "instruction sv",
            TestPublishState.PUBLISHED,
            arrayOf("06", "03"),
            "003",
            "TKRUA1",
            "0004",
            arrayOf("002", "003"),
        )

        val timeBeforeCreate = nowFromDb(mockMvc)
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(testAssignment)
        val timeAfterCreate = nowFromDb(mockMvc)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(testAssignment, createdAssignment)
        assertThat(createdAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdAssignment.createdAt, timeAfterCreate, "createdAt")
        assertEquals(createdAssignment.createdAt, createdAssignment.updatedAt)

        val assignmentById: TestSukoAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertEquals(mapper.writeValueAsString(createdAssignment), mapper.writeValueAsString(assignmentById))

        // update request
        val updatedAssignment = TestSukoAssignmentDtoIn(
            testAssignment.exam,
            "new name fi",
            "new name sv",
            "new content fi",
            "new content sv",
            "new instruction fi",
            "new instruction sv",
            TestPublishState.DRAFT,
            arrayOf("04", "05"),
            "001",
            "TKRUB3",
            "0010",
            arrayOf("002", "004"),
        )
        val updatedAssignmentStr = mapper.writeValueAsString(updatedAssignment)
        val timeBeforeUpdate = nowFromDb(mockMvc)
        val updatedAssignmentId =
            mockMvc.perform(updateAssignmentReq(assignmentById.id, updatedAssignmentStr)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertEquals(updatedAssignmentId, assignmentById.id.toString())

        val updatedAssignmentById = getAssignmentById<TestSukoAssignmentDtoOut>(assignmentById.id)

        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(updatedAssignment, updatedAssignmentById)
        assertEquals(createdAssignment.authorOid, updatedAssignmentById.authorOid)
        assertEquals(createdAssignment.createdAt, updatedAssignmentById.createdAt)
        assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedAssignmentById.updatedAt, timeAfterUpdate, "updatedAt")
    }

    val minimalSukoAssignmentIn = TestSukoAssignmentDtoIn(
        Exam.SUKO.toString(),
        "nameFi",
        "",
        "",
        "",
        "",
        "",
        TestPublishState.PUBLISHED,
        emptyArray(),
        "003",
        "TKRUA1",
        null,
        emptyArray(),
    )
    val minimalLdAssignmentIn = TestLdAssignmentDtoIn(
        Exam.LD.toString(),
        "nameFi",
        "",
        "",
        "",
        "",
        "",
        TestPublishState.PUBLISHED,
        emptyArray(),
        arrayOf("20202021"),
        "1"
    )

    val minimalPuhviAssignmentIn = TestPuhviAssignmentDtoIn(
        Exam.PUHVI.toString(),
        "nameFi",
        "",
        "",
        "",
        "",
        "",
        TestPublishState.PUBLISHED,
        emptyArray(),
        "001",
        arrayOf("20202021")
    )

    @Test
    @WithYllapitajaRole
    fun createMinimalSukoAssignment() {
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(minimalSukoAssignmentIn, createdAssignment)
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with both names blank`() {
        val responseContent =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(minimalSukoAssignmentIn.copy(nameFi = ""))))
                .andExpect(status().isBadRequest()).andReturn().response.contentAsString
        assertThat(responseContent).isEqualTo("Global error: At least one of the name fields must be non-empty")
    }

    @Test
    @WithYllapitajaRole
    fun anyMissingFieldYields400() {
        SukoAssignmentDtoIn::class.memberProperties.forEach { field ->
            val dtoInMap: Map<*, *> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
            val jsonWithFieldRemoved = mapper.writeValueAsString(dtoInMap - field.name)
            val response = mockMvc.perform(createAssignmentReq(jsonWithFieldRemoved)).andReturn().response
            assertThat(response.status).isEqualTo(HttpStatus.SC_BAD_REQUEST)
                .`as`("missing ${field.name} yields bad request")
            assertThat(response.contentAsString).contains("property ${field.name} due to missing")
                .`as`("missing ${field.name} yields proper error message")
        }
    }

    @Test
    @WithYllapitajaRole
    fun missingExamFieldYields400() {
        val dtoInMap: Map<*, *> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
        val jsonWithExamRemoved = mapper.writeValueAsString(dtoInMap - "exam")
        val responseBody = mockMvc.perform(createAssignmentReq(jsonWithExamRemoved)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody).contains("missing type id property 'exam'")
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment invalid exam`() {
        val responseContent =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(minimalSukoAssignmentIn.copy(exam = "SCHUKO"))))
                .andExpect(status().isBadRequest()).andReturn().response.contentAsString
        assertThat(responseContent).contains("Could not resolve type id 'SCHUKO' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with invalid publishState`() {
        val jsonWithInvalidPublishState =
            mapper.writeValueAsString(minimalSukoAssignmentIn.copy(publishState = TestPublishState.OLEMATON))
        val responseBody =
            mockMvc.perform(createAssignmentReq(jsonWithInvalidPublishState)).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString
        assertThat(responseBody).contains("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"OLEMATON\": not one of the values accepted")
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with html in name`() {
        val json =
            mapper.writeValueAsString(minimalSukoAssignmentIn.copy(nameFi = "<b>nameFi</b>", nameSv = "<i>nameSv</i>"))
        val responseBody = mockMvc.perform(createAssignmentReq(json)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody).isEqualTo(
            """
            nameFi: Non-plain content found
            nameSv: Non-plain content found
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with too long name`() {
        val longName = "1234567890".repeat(100) + "X"
        val json = mapper.writeValueAsString(minimalSukoAssignmentIn.copy(nameFi = longName, nameSv = longName))
        val responseBody = mockMvc.perform(createAssignmentReq(json)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody).isEqualTo(
            """
            nameFi: size must be between 0 and 1000
            nameSv: size must be between 0 and 1000
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with safe html in content`() {
        val safeContent = """moi <ul class="list-disc"><li>moi</li></ul> moi"""
        val assignmentIn = minimalSukoAssignmentIn.copy(contentFi = safeContent)
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(assignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(assignmentIn, createdAssignment)
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with script tag in content`() {
        val attackContent = "moi <script>alert('moi')</script> moi"
        val json = mapper.writeValueAsString(
            minimalSukoAssignmentIn.copy(
                contentFi = attackContent, contentSv = attackContent
            )
        )
        val responseBody = mockMvc.perform(createAssignmentReq(json)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody).isEqualTo(
            """
            contentFi: Unsafe HTML content found
            contentSv: Unsafe HTML content found
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun sukoAssignmentUpdateFailsWhenIdDoesNotExist() {
        val nonExistentId = -1
        val errorMessage =
            mockMvc.perform(updateAssignmentReq(nonExistentId, mapper.writeValueAsString(minimalSukoAssignmentIn)))
                .andExpect(status().isNotFound).andReturn().response.contentAsString
        assertThat(errorMessage).isEqualTo("Assignment not found $nonExistentId")
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
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(assignmentWithInvalidKoodiArvos)))
                .andExpect(status().isBadRequest).andReturn().response.contentAsString.trimIndent()

        assertThat(errorMessage).isEqualTo(
            """
                aiheKoodiArvos: Invalid KoodiArvos
                assignmentTypeKoodiArvo: Invalid KoodiArvo
                laajaalainenOsaaminenKoodiArvos: Invalid KoodiArvos
                oppimaaraKoodiArvo: Invalid KoodiArvo
                tavoitetasoKoodiArvo: Invalid KoodiArvo
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun ldAssignmentTest() {
        val testAssignment = TestLdAssignmentDtoIn(
            nameFi = "Lukiodiplomi assignment FI",
            contentFi = "Lukiodiplomi assignment content FI",
            instructionFi = "Lukiodiplomi assignment instruction FI",
            nameSv = "Lukiodiplomi assignment SV",
            contentSv = "Lukiodiplomi assignment content SV",
            instructionSv = "Lukiodiplomi assignment instruction SV",
            publishState = TestPublishState.PUBLISHED,
            exam = "LD",
            laajaalainenOsaaminenKoodiArvos = arrayOf("06", "03"),
            lukuvuosiKoodiArvos = arrayOf("20202021", "20222023"),
            aineKoodiArvo = "1"
        )

        val createdAssignment: TestLdAssignmentDtoOut =
            createAssignment(testAssignment)

        // get assignment DTO OUT
        val assignmentById: TestLdAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Lukiodiplomi assignment FI")
        assertEquals(assignmentById.contentFi, "Lukiodiplomi assignment content FI")
        assertEquals(assignmentById.publishState, TestPublishState.PUBLISHED)
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos).isEqualTo(arrayOf("06", "03"))
        assertThat(createdAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
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

        mockMvc.perform(updateAssignmentReq(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val updatedAssignment: TestLdAssignmentDtoOut = getAssignmentById(assignmentById.id)

        assertEquals(updatedAssignment.nameFi, "New test name")
        assertEquals(updatedAssignment.contentFi, "content")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "New test name")
        assertEquals(updatedAssignment.contentSv, "content")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, TestPublishState.PUBLISHED)
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos).isEqualTo(arrayOf("02"))
        assertThat(createdAssignment.authorOid).isEqualTo(assignmentById.authorOid)
        assertThat(updatedAssignment.lukuvuosiKoodiArvos).isEqualTo(arrayOf("20222023"))
        assertEquals(updatedAssignment.aineKoodiArvo, "2")

    }

    @Test
    @WithYllapitajaRole
    fun puhviAssignmentTest() {
        val testPuhviAssignment = TestPuhviAssignmentDtoIn(
            nameFi = "Puhvi assignment",
            nameSv = "Puhvi assignment",
            contentFi = "Puhvi assignment content",
            contentSv = "Puhvi assignment content",
            instructionFi = "Puhvi assignment instruction",
            instructionSv = "Puhvi assignment instruction",
            publishState = TestPublishState.PUBLISHED,
            exam = "PUHVI",
            assignmentTypeKoodiArvo = "001",
            laajaalainenOsaaminenKoodiArvos = arrayOf("06", "03"),
            lukuvuosiKoodiArvos = arrayOf("20222023")
        )

        val createdAssignment: TestPuhviAssignmentDtoOut = createAssignment(testPuhviAssignment)
        val assignmentById: TestPuhviAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Puhvi assignment")
        assertEquals(assignmentById.nameSv, "Puhvi assignment")
        assertEquals(assignmentById.contentFi, "Puhvi assignment content")
        assertEquals(assignmentById.contentSv, "Puhvi assignment content")
        assertEquals(assignmentById.instructionFi, "Puhvi assignment instruction")
        assertEquals(assignmentById.instructionSv, "Puhvi assignment instruction")
        assertEquals(assignmentById.publishState, TestPublishState.PUBLISHED)
        assertThat(assignmentById.lukuvuosiKoodiArvos).isEqualTo(arrayOf("20222023"))
        assertEquals(assignmentById.assignmentTypeKoodiArvo, "001")
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos).isEqualTo(arrayOf("06", "03"))
        assertThat(createdAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)

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

        mockMvc.perform(updateAssignmentReq(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val updatedAssignment: TestPuhviAssignmentDtoOut = getAssignmentById(assignmentById.id)

        assertEquals(updatedAssignment.nameFi, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentFi, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentSv, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, TestPublishState.PUBLISHED)
        assertEquals(updatedAssignment.assignmentTypeKoodiArvo, "002")
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos).isEqualTo(arrayOf("06", "01"))
        assertThat(updatedAssignment.authorOid).isEqualTo(assignmentById.authorOid)
        assertThat(updatedAssignment.lukuvuosiKoodiArvos).isEqualTo(arrayOf("20202021"))
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"PUBLISHED\",\"assignmentTypeKoodiArvo\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(createAssignmentReq(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(createAssignmentReq(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    @WithYllapitajaRole
    fun assignmentNotFound() {
        val getResult =
            mockMvc.perform(getAssignmentByIdReq(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("Assignment not found 999")
    }

    @Test
    fun getAssignmentsWithNoRole() {
        mockMvc.perform(getAllAssignmentsReq(Exam.SUKO)).andExpect(status().is3xxRedirection())
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentDraftAsOpettaja() {
        idsOfAssignmentDrafts.forEach() {
            mockMvc.perform(getAssignmentByIdReq(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentsAsOpettaja() {
        val assignments: Array<TestSukoAssignmentDtoOut> = getAllAssignmentsForExam()
        assertTrue(
            assignments.none { it.publishState == TestPublishState.DRAFT }, "Opettaja should not see draft assignments"
        )
        assertEquals(8, assignments.size)
    }

    @Test
    @WithOpettajaRole
    fun assignmentTestInsufficientRole() {
        val testAssignmentStr = mapper.writeValueAsString(minimalSukoAssignmentIn)
        mockMvc.perform(createAssignmentReq(testAssignmentStr)).andExpect(status().isUnauthorized())
        mockMvc.perform(updateAssignmentReq(1, testAssignmentStr)).andExpect(status().isUnauthorized())
    }

    private inline fun <reified T : TestAssignmentOut> setAssignmentIsFavoriteAndVerify(
        id: Int,
        isFavorite: Boolean
    ): T {
        val exam = examByTestAssignmentOutClass(T::class)
        setAssignmentIsFavorite(exam, id, isFavorite)
        val assignmentById = getAssignmentById<T>(id)
        assertThat(assignmentById.isFavorite).isEqualTo(isFavorite)
        return assignmentById
    }

    private fun testMarkingAndQueryFavorites(localAssignmentIdToFavoriteAsOpettaja: Int) {
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(localAssignmentIdToFavoriteAsOpettaja, true)

        val assignments: Array<TestSukoAssignmentDtoOut> = getAllAssignmentsForExam()
        assignments.forEach {
            if (it.id == localAssignmentIdToFavoriteAsOpettaja) {
                assertEquals(true, it.isFavorite, "Assignment ${it.id} should be favorite")
            } else {
                assertEquals(false, it.isFavorite, "Assignment ${it.id} should not be favorite")
            }
        }

        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(localAssignmentIdToFavoriteAsOpettaja, false)
    }

    @Test
    @WithYllapitajaRole
    fun `set assignment as favorite and query it`() {
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
        testMarkingAndQueryFavorites(createdAssignment.id)
    }

    @Test
    @WithOpettajaRole
    fun `as opettaja toggle assignment to be favorite and query it`() {
        // get all assignments and choose one of them to favorite
        val localAssignmentIdToFavoriteAsOpettaja =
            getAllAssignmentsForExam<TestSukoAssignmentDtoOut>().first { it.publishState == TestPublishState.PUBLISHED }.id

        testMarkingAndQueryFavorites(localAssignmentIdToFavoriteAsOpettaja)
    }

    @Test
    @WithYllapitajaRole
    fun `set assignment as favorite and unfavored 2 times in a row`() {
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, true)
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, true)
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, false)
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, false)
    }

    @Test
    fun `favorite same assignment as different users`() {
        authenticateAsYllapitaja()
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)

        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, true)
        authenticateAsOpettaja()
        setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(createdAssignment.id, true)
    }

    @Test
    @WithYllapitajaRole
    fun `try setting an assignment as favorite which doesn't exist`() {
        val nonExistentId = -1
        val errorMessage =
            mockMvc.perform(setAssignmentIsFavoriteReq(Exam.SUKO, nonExistentId, true)).andExpect(status().isNotFound)
                .andReturn().response.contentAsString
        assertThat(errorMessage).isEqualTo("Assignment not found $nonExistentId")
    }

    @Test
    fun `test querying for the total amount of favorites`() {
        authenticateAsYllapitaja()
        val sukoAssignmentIds = (1..3).map {
            createAssignment<TestSukoAssignmentDtoOut>(minimalSukoAssignmentIn).id
        }
        val ldAssignmentIds = (1..3).map {
            createAssignment<TestLdAssignmentDtoOut>(minimalLdAssignmentIn).id
        }
        val puhviAssignmentIds = (1..3).map {
            createAssignment<TestPuhviAssignmentDtoOut>(minimalPuhviAssignmentIn).id
        }
        assertEquals(0, getTotalFavoriteCount())

        authenticateAsOpettaja()
        // mark all assignments as favorite
        var totalMarkedAsFavorite = 0
        sukoAssignmentIds.forEach {
            setAssignmentIsFavoriteAndVerify<TestSukoAssignmentDtoOut>(it, true)
            assertEquals(++totalMarkedAsFavorite, getTotalFavoriteCount())
        }
        ldAssignmentIds.forEach {
            setAssignmentIsFavoriteAndVerify<TestLdAssignmentDtoOut>(it, true)
            assertEquals(++totalMarkedAsFavorite, getTotalFavoriteCount())
        }
        puhviAssignmentIds.forEach {
            setAssignmentIsFavoriteAndVerify<TestPuhviAssignmentDtoOut>(it, true)
            assertEquals(++totalMarkedAsFavorite, getTotalFavoriteCount())
        }

        assertEquals(9, totalMarkedAsFavorite)
        assertEquals(totalMarkedAsFavorite, getTotalFavoriteCount())
        assertEquals(totalMarkedAsFavorite - 1, setAssignmentIsFavorite(Exam.SUKO, sukoAssignmentIds[0], false))
    }
}