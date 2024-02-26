package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumeroRekisteriHenkilo
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import jakarta.transaction.Transactional
import org.apache.http.HttpStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.stream.Stream
import kotlin.reflect.full.memberProperties
import kotlin.streams.asStream

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentControllerTest : AssignmentRequests() {
    @MockBean
    private lateinit var mockOppijanumerorekisteriClient: OppijanumerorekisteriClient

    @BeforeEach
    fun setupMocks() {
        Mockito.`when`(mockOppijanumerorekisteriClient.getUserDetailsByOid(anyString())) // when does not work inside BeforeAll
            .thenReturn(OppijanumeroRekisteriHenkilo(YllapitajaSecurityContextFactory().kayttajatiedot()))
    }

    fun assertCommonFieldsBetweenInAndOutEqual(assignmentIn: TestAssignmentIn, assignmentOut: AssignmentOut) {
        assertEquals(assignmentIn.nameFi, assignmentOut.nameFi)
        assertEquals(assignmentIn.nameSv, assignmentOut.nameSv)
        assertEquals(assignmentIn.instructionFi, assignmentOut.instructionFi)
        assertEquals(assignmentIn.instructionSv, assignmentOut.instructionSv)
        assertThat(assignmentIn.contentFi).isEqualTo(assignmentOut.contentFi).withFailMessage("contentFi")
        assertThat(assignmentIn.contentSv).isEqualTo(assignmentOut.contentSv).withFailMessage("contentSv")
        assertEquals(assignmentIn.publishState.toString(), assignmentOut.publishState.toString())
        assertThat(assignmentIn.laajaalainenOsaaminenKoodiArvos).isEqualTo(assignmentOut.laajaalainenOsaaminenKoodiArvos)
            .withFailMessage("laajaalainenOsaaminenKoodiArvos")
    }

    fun assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(
        sukoIn: TestSukoAssignmentDtoIn, sukoOut: SukoAssignmentDtoOut
    ) {
        assertEquals(Exam.SUKO, sukoOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(sukoIn, sukoOut)
        assertEquals(sukoIn.assignmentTypeKoodiArvo, sukoOut.assignmentTypeKoodiArvo)
        assertEquals(sukoIn.oppimaara, sukoOut.oppimaara)
        assertEquals(sukoIn.tavoitetasoKoodiArvo, sukoOut.tavoitetasoKoodiArvo)
        assertThat(sukoIn.aiheKoodiArvos).isEqualTo(sukoOut.aiheKoodiArvos).withFailMessage("aiheKoodiArvos")
    }

    fun assertCommonFieldsBetweenLdAssignmentInAndOutEqual(ldIn: TestLdAssignmentDtoIn, ldOut: LdAssignmentDtoOut) {
        assertEquals(Exam.LD, ldOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(ldIn, ldOut)
        assertThat(ldIn.lukuvuosiKoodiArvos).isEqualTo(ldOut.lukuvuosiKoodiArvos).withFailMessage("lukuvuosiKoodiArvos")
        assertEquals(ldIn.aineKoodiArvo, ldOut.aineKoodiArvo)
    }

    fun assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(
        puhviIn: TestPuhviAssignmentDtoIn,
        puhviOut: PuhviAssignmentDtoOut
    ) {
        assertEquals(Exam.PUHVI, puhviOut.exam)
        assertCommonFieldsBetweenInAndOutEqual(puhviIn, puhviOut)
        assertEquals(puhviIn.assignmentTypeKoodiArvo, puhviOut.assignmentTypeKoodiArvo)
        assertThat(puhviIn.lukuvuosiKoodiArvos).isEqualTo(puhviOut.lukuvuosiKoodiArvos)
            .withFailMessage("lukuvuosiKoodiArvos")
    }

    @Test
    @WithYllapitajaRole
    fun `create and update suko assignment`() {
        val testAssignment = TestSukoAssignmentDtoIn(
            "name fi",
            "name sv",
            "instruction fi",
            "instruction sv",
            listOf("content fi"),
            listOf("content sv"),
            TestPublishState.PUBLISHED,
            listOf("06", "03"),
            "003",
            Oppimaara("TKRUA1"),
            "0004",
            listOf("002", "003"),
        )

        val timeBeforeCreate = nowFromDb(mockMvc)
        val createdAssignment: SukoAssignmentDtoOut = createAssignment(testAssignment)
        val timeAfterCreate = nowFromDb(mockMvc)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(testAssignment, createdAssignment)
        assertThat(createdAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
        assertThat(createdAssignment.updaterOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdAssignment.createdAt, timeAfterCreate, "createdAt")
        assertEquals(createdAssignment.createdAt, createdAssignment.updatedAt)

        val assignmentById: SukoAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertEquals(mapper.writeValueAsString(createdAssignment), mapper.writeValueAsString(assignmentById))

        // update request
        val updatedAssignment = TestSukoAssignmentDtoIn(
            "new name fi",
            "new name sv",
            "new instruction fi",
            "new instruction sv",
            listOf("new content fi"),
            listOf("new content sv"),
            TestPublishState.DRAFT,
            listOf("04", "05"),
            "001",
            Oppimaara("TKRUB3"),
            "0010",
            listOf("002", "004"),
        )
        val timeBeforeUpdate = nowFromDb(mockMvc)
        val updatedAssignmentId = updateAssignment(assignmentById.id, updatedAssignment)
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertEquals(updatedAssignmentId, assignmentById.id.toString())

        val updatedAssignmentById = getAssignmentById<SukoAssignmentDtoOut>(assignmentById.id)
        assertEquals(2, updatedAssignmentById.version)

        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(updatedAssignment, updatedAssignmentById)
        assertEquals(createdAssignment.authorOid, updatedAssignmentById.authorOid)
        assertEquals(createdAssignment.updaterOid, updatedAssignmentById.updaterOid)
        // uusi versio luotu
        assertNotEquals(createdAssignment.createdAt, updatedAssignmentById.createdAt)
        assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedAssignmentById.updatedAt, timeAfterUpdate, "updatedAt")
    }

    @Test
    @WithYllapitajaRole
    fun ldAssignmentTest() {
        val ldAssignmentIn = TestLdAssignmentDtoIn(
            nameFi = "Lukiodiplomi assignment FI",
            nameSv = "Lukiodiplomi assignment SV",
            instructionFi = "Lukiodiplomi assignment instruction FI",
            instructionSv = "Lukiodiplomi assignment instruction SV",
            contentFi = listOf("Lukiodiplomi assignment content FI 0", "Lukiodiplomi assignment content FI 1"),
            contentSv = listOf("Lukiodiplomi assignment content SV 0", "Lukiodiplomi assignment content SV 1"),
            publishState = TestPublishState.PUBLISHED,
            laajaalainenOsaaminenKoodiArvos = listOf("06", "03"),
            lukuvuosiKoodiArvos = listOf("20202021", "20222023"),
            aineKoodiArvo = "1",
        )

        val createdAssignment: LdAssignmentDtoOut = createAssignment(ldAssignmentIn)
        val ldAssignmentOut: LdAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertCommonFieldsBetweenLdAssignmentInAndOutEqual(ldAssignmentIn, ldAssignmentOut)

        val editedLdAssignmentIn =
            TestLdAssignmentDtoIn(
                nameFi = "Updated Lukiodiplomi assignment FI",
                nameSv = "Updated Lukiodiplomi assignment SV",
                instructionFi = "Updated Lukiodiplomi assignment instruction FI",
                instructionSv = "Updated Lukiodiplomi assignment instruction SV",
                contentFi = listOf(
                    "Updated Lukiodiplomi assignment content FI 0",
                    "Updated Lukiodiplomi assignment content FI 1",
                    "Updated Lukiodiplomi assignment content FI 2"
                ),
                contentSv = listOf(
                    "Updated Lukiodiplomi assignment content SV 0",
                    "Updated Lukiodiplomi assignment content SV 1"
                ),
                publishState = TestPublishState.PUBLISHED,
                laajaalainenOsaaminenKoodiArvos = listOf("06", "02"),
                lukuvuosiKoodiArvos = listOf("20212022", "20232024"),
                aineKoodiArvo = "2",
            )
        val timeBeforeUpdate = nowFromDb(mockMvc)
        updateAssignment(ldAssignmentOut.id, editedLdAssignmentIn)
        val timeAfterUpdate = nowFromDb(mockMvc)

        val updatedAssignmentById = getAssignmentById<LdAssignmentDtoOut>(ldAssignmentOut.id)
        assertEquals(2, updatedAssignmentById.version)

        assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedAssignmentById.updatedAt, timeAfterUpdate, "updatedAt")
        assertCommonFieldsBetweenLdAssignmentInAndOutEqual(
            editedLdAssignmentIn,
            updatedAssignmentById
        )
    }

    @Test
    @WithYllapitajaRole
    fun puhviAssignmentTest() {
        val puhviAssignmentIn = TestPuhviAssignmentDtoIn(
            nameFi = "Puhvi assignment",
            nameSv = "Puhvi assignment",
            instructionFi = "Puhvi assignment instruction",
            instructionSv = "Puhvi assignment instruction",
            contentFi = listOf("Puhvi assignment content"),
            contentSv = listOf("Puhvi assignment content"),
            publishState = TestPublishState.PUBLISHED,
            laajaalainenOsaaminenKoodiArvos = listOf("06", "03"),
            assignmentTypeKoodiArvo = "001",
            lukuvuosiKoodiArvos = listOf("20222023"),
        )

        val createdAssignment: PuhviAssignmentDtoOut = createAssignment(puhviAssignmentIn)
        val puhviAssignmentOut: PuhviAssignmentDtoOut = getAssignmentById(createdAssignment.id)

        assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(puhviAssignmentIn, puhviAssignmentOut)

        val editedPuhviAssignmentIn = TestPuhviAssignmentDtoIn(
            nameFi = "Puhvi assignment edited",
            nameSv = "Puhvi assignment edited",
            instructionFi = "Puhvi assignment instruction",
            instructionSv = "Puhvi assignment instruction",
            contentFi = listOf("Puhvi assignment content edited"),
            contentSv = listOf("Puhvi assignment content edited"),
            publishState = TestPublishState.PUBLISHED,
            laajaalainenOsaaminenKoodiArvos = listOf("06", "01"),
            assignmentTypeKoodiArvo = "002",
            lukuvuosiKoodiArvos = listOf("20202021"),
        )

        val timeBeforeUpdate = nowFromDb(mockMvc)
        updateAssignment(puhviAssignmentOut.id, editedPuhviAssignmentIn)
        val timeAfterUpdate = nowFromDb(mockMvc)

        val updatedAssignmentById = getAssignmentById<PuhviAssignmentDtoOut>(puhviAssignmentOut.id)
        assertEquals(2, updatedAssignmentById.version)

        assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedAssignmentById.updatedAt, timeAfterUpdate, "updatedAt")
        assertCommonFieldsBetweenPuhviAssignmentInAndOutEqual(
            editedPuhviAssignmentIn,
            updatedAssignmentById
        )
    }


    @TestFactory
    @WithYllapitajaRole
    fun `only latest versions of assignments in get all assignment data`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdAssignment = when (exam!!) {
                    Exam.SUKO -> createAssignment<SukoAssignmentDtoOut>(minimalSukoAssignmentIn)
                    Exam.LD -> createAssignment<LdAssignmentDtoOut>(minimalLdAssignmentIn)
                    Exam.PUHVI -> createAssignment<PuhviAssignmentDtoOut>(minimalPuhviAssignmentIn)
                }
                val updatedAssignmentIn = when (exam) {
                    Exam.SUKO -> minimalSukoAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                    Exam.LD -> minimalLdAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                }

                updateAssignment(createdAssignment.id, updatedAssignmentIn)

                val assignments = when (exam) {
                    Exam.SUKO -> getAllAssignmentsForExam<SukoAssignmentCardDtoOut>()
                    Exam.LD -> getAllAssignmentsForExam<LdAssignmentCardDtoOut>()
                    Exam.PUHVI -> getAllAssignmentsForExam<PuhviAssignmentCardDtoOut>()
                }.content

                assertEquals(assignments.size, assignments.distinctBy { it.id }.size)
                assertEquals(2, assignments.find { it.id == createdAssignment.id }!!.version)
            }
        }

    @Test
    @WithYllapitajaRole
    fun createMinimalSukoAssignment() {
        val createdAssignment: SukoAssignmentDtoOut = createAssignment(minimalSukoAssignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(minimalSukoAssignmentIn, createdAssignment)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `updating an assignment saves updater oid`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdAssignment = when (exam!!) {
                    Exam.SUKO -> createAssignment<SukoAssignmentDtoOut>(minimalSukoAssignmentIn)
                    Exam.LD -> createAssignment<LdAssignmentDtoOut>(minimalLdAssignmentIn)
                    Exam.PUHVI -> createAssignment<PuhviAssignmentDtoOut>(minimalPuhviAssignmentIn)
                }
                assertThat(createdAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(createdAssignment.updaterOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)

                val updatedAssignmentIn = when (exam) {
                    Exam.SUKO -> minimalSukoAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                    Exam.LD -> minimalLdAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated")
                }

                updateAssignment(
                    createdAssignment.id,
                    updatedAssignmentIn,
                    yllapitaja2User
                )

                val updatedAssignment = when (exam) {
                    Exam.SUKO -> getAssignmentById<SukoAssignmentDtoOut>(createdAssignment.id)
                    Exam.LD -> getAssignmentById<LdAssignmentDtoOut>(createdAssignment.id)
                    Exam.PUHVI -> getAssignmentById<PuhviAssignmentDtoOut>(createdAssignment.id)
                }
                assertThat(updatedAssignment.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(updatedAssignment.updaterOid).isEqualTo(Yllapitaja2SecurityContextFactory().kayttajatiedot().oidHenkilo)
            }
        }


    private fun getMinimalAssignmentInByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> minimalSukoAssignmentIn
        Exam.LD -> minimalLdAssignmentIn
        Exam.PUHVI -> minimalPuhviAssignmentIn
    }

    private fun getAllAssignmentVersionsByExam(exam: Exam, id: Int) = when (exam) {
        Exam.SUKO -> getAllAssignmentVersions<SukoAssignmentDtoOut>(id)
        Exam.LD -> getAllAssignmentVersions<LdAssignmentDtoOut>(id)
        Exam.PUHVI -> getAllAssignmentVersions<PuhviAssignmentDtoOut>(id)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all versions and a certain version of assignment for different exams`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam get all versions and a certain version of assignment") {
                val createdAssignment = when (exam!!) {
                    Exam.SUKO -> createAssignment<SukoAssignmentDtoOut>(minimalSukoAssignmentIn)
                    Exam.LD -> createAssignment<LdAssignmentDtoOut>(minimalLdAssignmentIn)
                    Exam.PUHVI -> createAssignment<PuhviAssignmentDtoOut>(minimalPuhviAssignmentIn)
                }

                val assignments = (1..4).map { index ->
                    when (exam) {
                        Exam.SUKO -> minimalSukoAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated$index")
                        Exam.LD -> minimalLdAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated$index")
                        Exam.PUHVI -> minimalPuhviAssignmentIn.copy(nameFi = createdAssignment.nameFi + " updated$index")
                    }
                }

                assignments.forEach { assignment ->
                    updateAssignment(
                        createdAssignment.id,
                        assignment
                    )
                }

                assignments.forEachIndexed { index, assignment ->
                    val indexOfVersion = index + 2
                    val assignmentById = when (exam) {
                        Exam.SUKO -> getAssignmentById<SukoAssignmentDtoOut>(createdAssignment.id, indexOfVersion)
                        Exam.LD -> getAssignmentById<LdAssignmentDtoOut>(createdAssignment.id, indexOfVersion)
                        Exam.PUHVI -> getAssignmentById<PuhviAssignmentDtoOut>(createdAssignment.id, indexOfVersion)
                    }
                    assertCommonFieldsBetweenInAndOutEqual(assignment, assignmentById)
                }

                val kayttajatiedot = YllapitajaSecurityContextFactory().kayttajatiedot()
                val expectedUpdaterName = "${kayttajatiedot.etunimet} ${kayttajatiedot.sukunimi}"
                getAllAssignmentVersionsByExam(exam, createdAssignment.id).let { assignmentVersions ->
                    assertEquals(5, assignmentVersions.size)
                    assignmentVersions.forEachIndexed { index, assignment ->
                        assertThat(assignment.updaterName).isEqualTo(expectedUpdaterName)
                        if (index == 0) {
                            assertCommonFieldsBetweenInAndOutEqual(getMinimalAssignmentInByExam(exam), assignment)
                        } else {
                            assertCommonFieldsBetweenInAndOutEqual(assignments[index - 1], assignment)
                        }
                    }
                }
            }
        }

    @Test
    @WithYllapitajaRole
    fun `create assignment with both names blank`() {
        assertThatCreateInvalidAssignmentError(minimalSukoAssignmentIn.copy(nameFi = ""))
            .isEqualTo("Global error: At least one of the name fields must be non-empty")
    }

    @Test
    @WithYllapitajaRole
    fun `any missing suko field yields 400`() {
        val ignoredFields = listOf("contentType")
        SukoAssignmentDtoIn::class.memberProperties.filter { !ignoredFields.contains(it.name) }.forEach { field ->
            val dtoInMap: Map<*, *> = mapper.readValue(mapper.writeValueAsString(minimalSukoAssignmentIn))
            val jsonWithFieldRemoved = mapper.writeValueAsString(dtoInMap - field.name)
            val response = mockMvc.perform(createAssignmentReq(jsonWithFieldRemoved)).andReturn().response
            assertThat(response.status).`as`("missing ${field.name} yields bad request")
                .isEqualTo(HttpStatus.SC_BAD_REQUEST)
            if (field.name == "exam") {
                assertThat(response.contentAsString).contains("Invalid type: JSON parse error: Could not resolve subtype of [simple type, class fi.oph.ludos.assignment.Assignment]: missing type id property 'exam'")
                    .`as`("missing ${field.name} yields proper error message")
            } else {
                assertThat(response.contentAsString).contains("property ${field.name} due to missing")
                    .`as`("missing ${field.name} yields proper error message")
            }
        }
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with invalid exam`() {
        assertThatCreateInvalidAssignmentError(minimalSukoAssignmentIn.copy(exam = "SCHUKO"))
            .contains("Could not resolve type id 'SCHUKO' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with invalid publishState`() {
        assertThatCreateInvalidAssignmentError(minimalSukoAssignmentIn.copy(publishState = TestPublishState.OLEMATON))
            .contains("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"OLEMATON\": not one of the values accepted")
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with html in name`() {
        assertThatCreateInvalidAssignmentError(
            minimalSukoAssignmentIn.copy(nameFi = "<b>nameFi</b>", nameSv = "<i>nameSv</i>")
        ).isEqualTo(
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
        assertThatCreateInvalidAssignmentError(
            minimalSukoAssignmentIn.copy(nameFi = longName, nameSv = longName),
        ).isEqualTo(
            """
            nameFi: size must be between 0 and 1000
            nameSv: size must be between 0 and 1000
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with safe html in content`() {
        val safeContent = listOf("""moi <ul class="list-disc"><li>moi</li></ul> moi""")
        val assignmentIn = minimalSukoAssignmentIn.copy(contentFi = safeContent)
        val createdAssignment: SukoAssignmentDtoOut = createAssignment(assignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(assignmentIn, createdAssignment)
    }

    @Test
    @WithYllapitajaRole
    fun `create assignment with script tag in content`() {
        val attackContent = listOf("moi <script>alert('moi')</script> moi")
        assertThatCreateInvalidAssignmentError(
            minimalSukoAssignmentIn.copy(contentFi = attackContent, contentSv = attackContent)
        ).isEqualTo(
            """
            contentFi: Unsafe HTML content found
            contentSv: Unsafe HTML content found
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun `create ld assignment with too many content fields`() {
        val tooLargeList = List(101) { "content" }
        assertThatCreateInvalidAssignmentError(
            minimalLdAssignmentIn.copy(contentFi = tooLargeList, contentSv = tooLargeList),
        ).isEqualTo(
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
        assertThat(errorMessage).isEqualTo("Assignment $nonExistentId not found")
    }

    @Test
    @WithYllapitajaRole
    fun `invalid koodiarvos yield 400 with expected error messages`() {
        val assignmentWithInvalidKoodiArvos = minimalSukoAssignmentIn.copy(
            assignmentTypeKoodiArvo = "epavalidi",
            oppimaara = Oppimaara("epavalidi", "epavalidi"),
            tavoitetasoKoodiArvo = "epavalidi",
            aiheKoodiArvos = listOf("epavalidi1", "epavalidi2"),
            laajaalainenOsaaminenKoodiArvos = listOf("epavalidi3", "epavalidi4")
        )

        val errorMessage =
            mockMvc.perform(createAssignmentReq(mapper.writeValueAsString(assignmentWithInvalidKoodiArvos)))
                .andExpect(status().isBadRequest).andReturn().response.contentAsString.trimIndent()

        assertThat(errorMessage).isEqualTo(
            """
            aiheKoodiArvos: Invalid KoodiArvos
            assignmentTypeKoodiArvo: Invalid KoodiArvo
            laajaalainenOsaaminenKoodiArvos: Invalid KoodiArvos
            oppimaara: oppimaaraKoodiArvo 'epavalidi' not found in oppiaineetjaoppimaaratlops2021
            tavoitetasoKoodiArvo: Invalid KoodiArvo
            """.trimIndent()
        )
    }

    @Test
    @WithYllapitajaRole
    fun `oppimaara than cannot have tarkenne but given with tarkenne`() {
        assertThatCreateInvalidAssignmentError(
            minimalSukoAssignmentIn.copy(oppimaara = Oppimaara("TKFIAI", "RA")),
        ).isEqualTo("oppimaara: kielitarjontaKoodiArvo 'RA' given but 'TKFIAI' does not contain tarkenteet")
    }

    @Test
    @WithYllapitajaRole
    fun `oppimaara than can have tarkenne but tarkenne is invalid`() {
        assertThatCreateInvalidAssignmentError(
            minimalSukoAssignmentIn.copy(oppimaara = Oppimaara("VKA1", "epavalidi")),
        ).isEqualTo("oppimaara: kielitarjontaKoodiArvo 'epavalidi' not valid for 'VKA1'. Valid options: [EA, IA, JP, KI, PO, RA, SA, VE]")
    }

    @Test
    @WithYllapitajaRole
    fun `valid oppimaara with tarkenne`() {
        val assignmentIn = minimalSukoAssignmentIn.copy(oppimaara = Oppimaara("VKA1", "RA"))
        val assignmentOut: SukoAssignmentDtoOut = createAssignment(assignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(assignmentIn, assignmentOut)
    }

    @Test
    @WithYllapitajaRole
    fun `valid oppimaara that can have tarkenne but tarkenne not given`() {
        val assignmentIn = minimalSukoAssignmentIn.copy(oppimaara = Oppimaara("VKA1"))
        val assignmentOut: SukoAssignmentDtoOut = createAssignment(assignmentIn)
        assertCommonFieldsBetweenSukoAssignmentInAndOutEqual(assignmentIn, assignmentOut)
    }

    @Test
    @WithYllapitajaRole
    fun `assignment not found on GET`() {
        val getResult =
            mockMvc.perform(getAssignmentByIdReq(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("Assignment 999 not found")
    }

    @Test
    @WithYllapitajaRole
    fun `assignment not found on UPDATE`() {
        val updateResult = mockMvc.perform(
            updateAssignmentReq(
                999,
                mapper.writeValueAsString(minimalSukoAssignmentIn)
            )
        ).andExpect(status().isNotFound).andReturn()
        val responseContent = updateResult.response.contentAsString

        assertThat(responseContent).isEqualTo("Assignment 999 not found")
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentDraftAsOpettaja() {
        val idsOfDrafts = getAllAssignmentsForExam<SukoAssignmentCardDtoOut>().content
            .filter { it.publishState == PublishState.DRAFT }
            .map { it.id }

        idsOfDrafts.forEach {
            mockMvc.perform(getAssignmentByIdReq(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun `create and update with insufficient role`() {
        val testAssignmentStr = mapper.writeValueAsString(minimalSukoAssignmentIn)
        mockMvc.perform(createAssignmentReq(testAssignmentStr)).andExpect(status().isUnauthorized())
        mockMvc.perform(updateAssignmentReq(1, testAssignmentStr)).andExpect(status().isUnauthorized())
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a assignment`() {
        val assignmentId = createAssignment<SukoAssignmentDtoOut>(minimalSukoAssignmentIn).id

        updateAssignment(
            assignmentId,
            minimalSukoAssignmentIn.copy(publishState = TestPublishState.DELETED)
        )

        mockMvc.perform(getAssignmentByIdReq(Exam.SUKO, assignmentId)).andExpect(status().isNotFound)

        val noneHaveMatchingId =
            getAllAssignmentsForExam<SukoAssignmentCardDtoOut>().content.none { it.id == assignmentId }

        assertTrue(noneHaveMatchingId, "No assignments should have the ID of the deleted one")
    }

    @Test
    @WithYllapitajaRole
    fun `test valid html`() {
        val validContentFi = """
            <ol class="tiptap-numbered-list">
            <li><p>1</p></li>
            <li><p>2</p></li>
            <li><p>3</p></li>
            </ol>
            <h1 class="tiptap-text-h1">heading</h1>
            <ul class="tiptap-bullet-list">
            <li><p>1</p></li>
            </ul>
            <blockquote class="tiptap-blockquote">
            <p>this is a block quote</p>
            </blockquote>
            <p><a target="_blank" rel="noopener noreferrer nofollow" class="tiptap-link" href="https://oph.fi">oph</a></p>
        """.trimIndent()
        createAssignment<SukoAssignmentDtoOut>(minimalSukoAssignmentIn.copy(contentFi = listOf(validContentFi)))
    }
}
