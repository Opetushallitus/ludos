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

    fun assertCommonFieldsBetweenInAndOutEqual(assignmentIn: TestAssignmentIn, assignmentOut: TestAssignmentOut) {
        assertEquals(assignmentIn.nameFi, assignmentOut.nameFi)
        assertEquals(assignmentIn.nameSv, assignmentOut.nameSv)
        assertEquals(assignmentIn.instructionFi, assignmentOut.instructionFi)
        assertEquals(assignmentIn.instructionSv, assignmentOut.instructionSv)
        assertThat(assignmentIn.contentFi).isEqualTo(assignmentOut.contentFi).withFailMessage("contentFi")
        assertThat(assignmentIn.contentSv).isEqualTo(assignmentOut.contentSv).withFailMessage("contentSv")
        assertEquals(assignmentIn.publishState, assignmentOut.publishState)
        assertThat(assignmentIn.laajaalainenOsaaminenKoodiArvos).isEqualTo(assignmentOut.laajaalainenOsaaminenKoodiArvos)
            .withFailMessage("laajaalainenOsaaminenKoodiArvos")
    }

    fun assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(
        sukoIn: TestSukoAssignmentDtoIn, sukoOut: TestSukoAssignmentDtoOut
    ) {
        assertEquals(Exam.SUKO, sukoOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(sukoIn, sukoOut)
        assertEquals(sukoIn.assignmentTypeKoodiArvo, sukoOut.assignmentTypeKoodiArvo)
        assertEquals(sukoIn.oppimaaraKoodiArvo, sukoOut.oppimaaraKoodiArvo)
        assertEquals(sukoIn.tavoitetasoKoodiArvo, sukoOut.tavoitetasoKoodiArvo)
        assertThat(sukoIn.aiheKoodiArvos).isEqualTo(sukoOut.aiheKoodiArvos).withFailMessage("aiheKoodiArvos")
    }

    fun assertCommonFieldsBetweenLdAssignmentInAndOutEqual(ldIn: TestLdAssignmentDtoIn, ldOut: TestLdAssignmentDtoOut) {
        assertEquals(Exam.LD, ldOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(ldIn, ldOut)
        assertThat(ldIn.lukuvuosiKoodiArvos).isEqualTo(ldOut.lukuvuosiKoodiArvos).withFailMessage("lukuvuosiKoodiArvos")
        assertEquals(ldIn.aineKoodiArvo, ldOut.aineKoodiArvo)
    }

    fun assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(
        puhviIn: TestPuhviAssignmentDtoIn,
        puhviOut: TestPuhviAssignmentDtoOut
    ) {
        assertEquals(Exam.PUHVI, puhviOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(puhviIn, puhviOut)
        assertEquals(puhviIn.assignmentTypeKoodiArvo, puhviOut.assignmentTypeKoodiArvo)
        assertThat(puhviIn.lukuvuosiKoodiArvos).isEqualTo(puhviOut.lukuvuosiKoodiArvos)
            .withFailMessage("lukuvuosiKoodiArvos")
    }

    @Test
    @WithYllapitajaRole
    fun createAndGetByIdAndUpdateSukoAssignment() {
        val testAssignment = TestSukoAssignmentDtoIn(
            "SUKO",
            "name fi",
            "name sv",
            "instruction fi",
            "instruction sv",
            arrayOf("content fi"),
            arrayOf("content sv"),
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
            "new instruction fi",
            "new instruction sv",
            arrayOf("new content fi"),
            arrayOf("new content sv"),
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
        arrayOf(""),
        arrayOf(""),
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
        arrayOf(""),
        arrayOf(""),
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
        arrayOf(""),
        arrayOf(""),
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
        val safeContent = arrayOf("""moi <ul class="list-disc"><li>moi</li></ul> moi""")
        val assignmentIn = minimalSukoAssignmentIn.copy(contentFi = safeContent)
        val createdAssignment: TestSukoAssignmentDtoOut = createAssignment(assignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(assignmentIn, createdAssignment)
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with script tag in content`() {
        val attackContent = arrayOf("moi <script>alert('moi')</script> moi")
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
    fun `create ld assignment with too many content fields`() {
        val tooLargeArray = Array(1001) { "content" }
        val json = mapper.writeValueAsString(
            minimalLdAssignmentIn.copy(
                contentFi = tooLargeArray, contentSv = tooLargeArray
            )
        )
        val responseBody = mockMvc.perform(createAssignmentReq(json)).andExpect(status().isBadRequest())
            .andReturn().response.contentAsString
        assertThat(responseBody).isEqualTo(
            """
            contentFi: size must be between 0 and 100
            contentSv: size must be between 0 and 100
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
        val ldAssignmentIn = TestLdAssignmentDtoIn(
            nameFi = "Lukiodiplomi assignment FI",
            contentFi = arrayOf("Lukiodiplomi assignment content FI 0", "Lukiodiplomi assignment content FI 1"),
            instructionFi = "Lukiodiplomi assignment instruction FI",
            nameSv = "Lukiodiplomi assignment SV",
            contentSv = arrayOf("Lukiodiplomi assignment content SV 0", "Lukiodiplomi assignment content SV 1"),
            instructionSv = "Lukiodiplomi assignment instruction SV",
            publishState = TestPublishState.PUBLISHED,
            exam = "LD",
            laajaalainenOsaaminenKoodiArvos = arrayOf("06", "03"),
            lukuvuosiKoodiArvos = arrayOf("20202021", "20222023"),
            aineKoodiArvo = "1"
        )

        val createdAssignment: TestLdAssignmentDtoOut =
            createAssignment(ldAssignmentIn)

        // get assignment DTO OUT
        val ldAssignmentOut: TestLdAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertCommonFieldsBetweenLdAssignmentInAndOutEqual(ldAssignmentIn, ldAssignmentOut)

        // update assignment
        val editedLdAssignmentIn = mapper.writeValueAsString(
            TestLdAssignmentDtoIn(
                nameFi = "Updated Lukiodiplomi assignment FI",
                contentFi = arrayOf(
                    "Updated Lukiodiplomi assignment content FI 0",
                    "Updated Lukiodiplomi assignment content FI 1",
                    "Updated Lukiodiplomi assignment content FI 2"
                ),
                instructionFi = "Updated Lukiodiplomi assignment instruction FI",
                nameSv = "Updated Lukiodiplomi assignment SV",
                contentSv = arrayOf(
                    "Updated Lukiodiplomi assignment content SV 0",
                    "Updated Lukiodiplomi assignment content SV 1"
                ),
                instructionSv = "Updated Lukiodiplomi assignment instruction SV",
                publishState = TestPublishState.PUBLISHED,
                exam = "LD",
                laajaalainenOsaaminenKoodiArvos = arrayOf("06", "02"),
                lukuvuosiKoodiArvos = arrayOf("20212022", "20232024"),
                aineKoodiArvo = "2"
            )
        )

        mockMvc.perform(updateAssignmentReq(ldAssignmentOut.id, editedLdAssignmentIn)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val editedLdAssignmentOut: TestLdAssignmentDtoOut = getAssignmentById(ldAssignmentOut.id)

        assertCommonFieldsBetweenLdAssignmentInAndOutEqual(
            mapper.readValue(editedLdAssignmentIn),
            editedLdAssignmentOut
        )
    }

    @Test
    @WithYllapitajaRole
    fun puhviAssignmentTest() {
        val puhviAssignmentIn = TestPuhviAssignmentDtoIn(
            nameFi = "Puhvi assignment",
            nameSv = "Puhvi assignment",
            contentFi = arrayOf("Puhvi assignment content"),
            contentSv = arrayOf("Puhvi assignment content"),
            instructionFi = "Puhvi assignment instruction",
            instructionSv = "Puhvi assignment instruction",
            publishState = TestPublishState.PUBLISHED,
            exam = "PUHVI",
            assignmentTypeKoodiArvo = "001",
            laajaalainenOsaaminenKoodiArvos = arrayOf("06", "03"),
            lukuvuosiKoodiArvos = arrayOf("20222023")
        )

        val createdAssignment: TestPuhviAssignmentDtoOut = createAssignment(puhviAssignmentIn)
        val puhviAssignmentOut: TestPuhviAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(puhviAssignmentIn, puhviAssignmentOut)

        // update assignment
        val editedPuhviAssignmentIn = """{
                "exam": "${Exam.PUHVI}",
                "nameFi": "Puhvi assignment edited",
                "nameSv": "Puhvi assignment edited",
                "instructionFi": "Puhvi assignment instruction",
                "instructionSv": "Puhvi assignment instruction",
                "contentFi": ["Puhvi assignment content edited"],
                "contentSv": ["Puhvi assignment content edited"],
                "publishState": "PUBLISHED",
                "exam": "PUHVI",
                "assignmentTypeKoodiArvo": "002",
                "laajaalainenOsaaminenKoodiArvos": ["06", "01"],
                "lukuvuosiKoodiArvos": ["20202021"]
            }""".trimIndent()

        mockMvc.perform(updateAssignmentReq(puhviAssignmentOut.id, editedPuhviAssignmentIn)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val editedPuhviAssignmentOut: TestPuhviAssignmentDtoOut = getAssignmentById(puhviAssignmentOut.id)

        assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(
            mapper.readValue(editedPuhviAssignmentIn),
            editedPuhviAssignmentOut
        )
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