package fi.oph.ludos.instruction

import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumeroRekisteriHenkilo
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import jakarta.transaction.Transactional
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
import java.time.ZonedDateTime
import java.util.stream.Stream
import kotlin.streams.asStream

val minimalSukoInstruction = TestSukoInstructionDtoIn(
    nameFi = "nameFi",
    nameSv = "",
    contentFi = "",
    contentSv = "",
    shortDescriptionFi = "",
    shortDescriptionSv = "",
    publishState = PublishState.PUBLISHED,
    exam = Exam.SUKO,
)

val minimalLdInstruction = TestLdInstructionDtoIn(
    nameFi = "nameFi",
    nameSv = "",
    contentFi = "",
    contentSv = "",
    publishState = PublishState.PUBLISHED,
    aineKoodiArvo = "1",
    exam = Exam.LD,
)

val minimalPuhviInstruction = TestPuhviInstructionDtoIn(
    nameFi = "nameFi",
    nameSv = "",
    contentFi = "",
    contentSv = "",
    shortDescriptionFi = "",
    shortDescriptionSv = "",
    publishState = PublishState.PUBLISHED,
    exam = Exam.PUHVI,
)

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InstructionControllerTest : InstructionRequests() {
    @MockBean
    private lateinit var mockOppijanumerorekisteriClient: OppijanumerorekisteriClient

    @BeforeAll
    fun setup() {
        mockMvc.perform(emptyDbRequest().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
        mockMvc.perform(seedDbWithInstructions().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
    }

    @BeforeEach
    fun setupMocks() {
        Mockito.`when`(mockOppijanumerorekisteriClient.getUserDetailsByOid(anyString())) // when does not work in BeforeAll
            .thenReturn(OppijanumeroRekisteriHenkilo(YllapitajaSecurityContextFactory().kayttajatiedot()))
    }


    val attachments: List<InstructionAttachmentIn> = listOf(
        InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture1.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture1 pdf", Language.FI, 1)
        ), InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture2.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture2 pdf", Language.SV, 1)
        )
    )

    fun assertFieldsInAndOutEqual(
        instructionIn: TestInstruction,
        instructionOut: InstructionOut
    ) {
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, instructionOut.authorOid)
        assertNotNull(instructionOut.id)
        assertNotNull(instructionOut.createdAt)
        assertNotNull(instructionOut.updatedAt)
        assertEquals(instructionIn.nameFi, instructionOut.nameFi)
        assertEquals(instructionIn.nameSv, instructionOut.nameSv)
        assertEquals(instructionIn.contentFi, instructionOut.contentFi)
        assertEquals(instructionIn.contentSv, instructionOut.contentSv)
        assertEquals(instructionIn.publishState, instructionOut.publishState)

        when (instructionIn) {
            is TestLdInstructionDtoIn -> if (instructionOut is LdInstructionDtoOut) {
                assertEquals(instructionIn.aineKoodiArvo, instructionOut.aineKoodiArvo)
            }

            is TestSukoInstructionDtoIn -> if (instructionOut is SukoInstructionDtoOut) {
                assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
                assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
            }

            is TestPuhviInstructionDtoIn -> if (instructionOut is PuhviInstructionDtoOut) {
                assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
                assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
            }
        }
    }

    fun assertAttachments(
        expected: List<InstructionAttachmentIn>,
        actual: List<InstructionAttachmentDtoOut>,
        uploadDateRange: Pair<ZonedDateTime, ZonedDateTime>? = null
    ) {
        assertEquals(expected.size, actual.size)
        expected.forEachIndexed { i, expectedAttachmentData ->
            val expectedAttachmentMetadata = expectedAttachmentData.metadata
            if (expectedAttachmentMetadata.fileKey != null) {
                assertEquals(expectedAttachmentMetadata.fileKey, actual[i].fileKey)
            } else {
                assertNotNull(actual[i].fileKey)
            }
            assertEquals(expectedAttachmentData.file.originalFilename, actual[i].fileName)
            assertEquals(expectedAttachmentMetadata.name, actual[i].name)
            assertEquals(expectedAttachmentMetadata.instructionVersion, actual[i].instructionVersion)
            assertEquals(expectedAttachmentMetadata.language, actual[i].language)
            assertNotNull(actual[i].fileUploadDate)
            if (uploadDateRange != null) {
                assertTimeIsRoughlyBetween(
                    uploadDateRange.first,
                    actual[i].fileUploadDate,
                    uploadDateRange.second,
                    "uploadDateTime of ${expectedAttachmentMetadata.name}"
                )
            }
        }
    }

    data class UpdatedInstructionAssertionData(
        val updatedInstructionDtoIn: TestInstruction,
        val updatedInstructionById: InstructionOut,
        val createdInstruction: InstructionOut,
        val timeBeforeUpdate: ZonedDateTime,
        val timeAfterUpdate: ZonedDateTime,
        val expectedVersion: Int,
        val expectedAttachment: List<InstructionAttachmentIn>
    )

    private fun assertUpdatedInstruction(assertionData: UpdatedInstructionAssertionData) {
        with(assertionData) {
            assertFieldsInAndOutEqual(updatedInstructionDtoIn, updatedInstructionById)
            assertEquals(createdInstruction.authorOid, updatedInstructionById.authorOid, "Author OIDs should be equal")
            assertEquals(createdInstruction.id, updatedInstructionById.id, "Instruction IDs should be equal")
            assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedInstructionById.updatedAt, timeAfterUpdate, "updatedAt")
            assertEquals(expectedVersion, updatedInstructionById.version)

            assertAttachments(expectedAttachment, updatedInstructionById.attachments)
        }
    }

    private fun updateInstructionTest(
        exam: Exam,
        createdInstruction: InstructionOut,
        updatedInstructionDtoIn: TestInstruction
    ) {
        val newAttachment = InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture2.pdf", "new-attachments"),
            InstructionAttachmentMetadataDtoIn(null, "fixture2.pdf", Language.FI, 1)
        )

        val timeBeforeUpdate = nowFromDb(mockMvc)
        val updatedId = performInstructionUpdate(
            createdInstruction.id,
            mapper.writeValueAsString(updatedInstructionDtoIn),
            listOf(),
            listOf(newAttachment)
        )
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertEquals(createdInstruction.id, updatedId)

        val updatedInstructionById = when (exam) {
            Exam.SUKO -> performGetInstructionById<SukoInstructionDtoOut>(createdInstruction.id)
            Exam.LD -> performGetInstructionById<LdInstructionDtoOut>(createdInstruction.id)
            Exam.PUHVI -> performGetInstructionById<PuhviInstructionDtoOut>(createdInstruction.id)
        }

        val assertionData = UpdatedInstructionAssertionData(
            updatedInstructionDtoIn,
            updatedInstructionById,
            createdInstruction,
            timeBeforeUpdate,
            timeAfterUpdate,
            2,
            listOf(
                newAttachment.copy(
                    metadata = newAttachment.metadata.copy(
                        instructionVersion = 2
                    )
                )
            )
        )

        assertUpdatedInstruction(assertionData)
    }

    fun testInstruction(exam: Exam, instructionDtoIn: TestInstruction, updatedInstructionDtoIn: TestInstruction) {
        val timeBeforeCreate = nowFromDb(mockMvc)
        val dtoInStr = mapper.writeValueAsString(instructionDtoIn)
        val createdInstruction = when (exam) {
            Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(dtoInStr, attachments)
            Exam.LD -> createInstruction<LdInstructionDtoOut>(dtoInStr, attachments)
            Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(dtoInStr, attachments)
        }
        val timeAfterCreate = nowFromDb(mockMvc)

        assertFieldsInAndOutEqual(instructionDtoIn, createdInstruction)
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdInstruction.createdAt, timeAfterCreate, "createdAt")
        assertAttachments(attachments, createdInstruction.attachments, Pair(timeBeforeCreate, timeAfterCreate))

        val createdInstructionById = when (exam) {
            Exam.SUKO -> performGetInstructionById<SukoInstructionDtoOut>(createdInstruction.id)
            Exam.LD -> performGetInstructionById<LdInstructionDtoOut>(createdInstruction.id)
            Exam.PUHVI -> performGetInstructionById<PuhviInstructionDtoOut>(createdInstruction.id)
        }

        assertEquals(createdInstruction, createdInstructionById)

        testDownloadingAttachment(createdInstruction)

        updateInstructionTest(
            exam,
            createdInstruction,
            updatedInstructionDtoIn
        )
    }

    private fun testDownloadingAttachment(createdInstruction: InstructionOut) {
        val firstAttachmentBytes =
            mockMvc.perform(
                downloadInstructionAttachment(
                    createdInstruction.attachments[0].fileKey,
                    createdInstruction.version
                )
            ).andExpect(status().isOk).andReturn().response.contentAsByteArray

        val firstAttachmentExpectedBytes = readAttachmentFixtureFile("fixture1.pdf", "file").bytes
        assertThat(firstAttachmentBytes.size).isEqualTo(firstAttachmentExpectedBytes.size)
        assertThat(firstAttachmentBytes).isEqualTo(firstAttachmentExpectedBytes)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all instructions of each exam`(): Stream<DynamicTest> = Exam.entries.stream().map { exam ->
        DynamicTest.dynamicTest("Get all instructions for $exam") {
            val instructions = when (exam!!) {
                Exam.SUKO -> getAllInstructions<SukoInstructionFilters, SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>().content
                Exam.LD -> getAllInstructions<LdInstructionFilters, LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>().content
                Exam.PUHVI -> getAllInstructions<PuhviInstructionFilters, PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>().content
            }

            assertEquals(12, instructions.size)
            assertTrue(
                instructions.all { it.exam == exam },
                "Wrong exam in list, expected: $exam, got ${instructions.map { it.exam }}"
            )

            val expectedNumbersInPage = (0..11).toList()
            val actualNumbersInName = instructions.flatMap { cert ->
                Regex("\\d+").findAll(cert.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage, actualNumbersInName)
        }
    }

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() = testInstruction(
        exam = Exam.SUKO,
        instructionDtoIn = TestSukoInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI",
            nameSv = "SUKO Test Instruction SV",
            contentFi = "SUKO Instruction content FI",
            contentSv = "SUKO Instruction content SV",
            shortDescriptionFi = "SUKO Short description FI",
            shortDescriptionSv = "SUKO Short description SV",
            publishState = PublishState.PUBLISHED,
            exam = Exam.SUKO
        ),
        updatedInstructionDtoIn = TestSukoInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI updated",
            nameSv = "SUKO Test Instruction SV updated",
            contentFi = "SUKO Instruction content FI updated",
            contentSv = "SUKO Instruction content SV updated",
            shortDescriptionFi = "SUKO Short description FI updated",
            shortDescriptionSv = "SUKO Short description SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.SUKO
        )
    )

    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() = testInstruction(
        exam = Exam.PUHVI,
        instructionDtoIn = TestPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI",
            nameSv = "PUHVI Test Instruction SV",
            contentFi = "PUHVI Instruction content FI",
            contentSv = "PUHVI Instruction content SV",
            shortDescriptionFi = "PUHVI Short description FI",
            shortDescriptionSv = "PUHVI Short description SV",
            publishState = PublishState.PUBLISHED,
            exam = Exam.PUHVI
        ),
        updatedInstructionDtoIn = TestPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI updated",
            nameSv = "PUHVI Test Instruction SV updated",
            contentFi = "PUHVI Instruction content FI updated",
            contentSv = "PUHVI Instruction content SV updated",
            shortDescriptionFi = "PUHVI Short description FI updated",
            shortDescriptionSv = "PUHVI Short description SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.PUHVI
        )
    )

    @Test
    @WithYllapitajaRole
    fun ldInstructionTest() = testInstruction(
        Exam.LD,
        instructionDtoIn = TestLdInstructionDtoIn(
            nameFi = "LD Test Instruction FI",
            nameSv = "LD Test Instruction SV",
            contentFi = "LD Instruction content FI",
            contentSv = "LD Instruction content SV",
            publishState = PublishState.PUBLISHED,
            exam = Exam.LD,
            aineKoodiArvo = "1"
        ),
        updatedInstructionDtoIn = TestLdInstructionDtoIn(
            nameFi = "LD Test Instruction FI updated",
            nameSv = "LD Test Instruction SV updated",
            contentFi = "LD Instruction content FI updated",
            contentSv = "LD Instruction content SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.LD,
            aineKoodiArvo = "9"
        )
    )

    private fun assertFilteredLdInstructionList(
        filters: LdInstructionFilters,
        expectedSize: Int,
        expectedNumbersInList: List<Int>,
        expectedAineOptions: List<Int>
    ) {
        val instructionsOut: LdInstructionListDtoOut = getAllInstructions(filters)
        assertEquals(expectedSize, instructionsOut.content.size)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.LD },
            "Wrong exam in list, expected: ${Exam.LD}, got ${instructionsOut.content.map { it.exam }}"
        )

        val expectedFilterOptions = LdInstructionFilterOptionsDtoOut(
            aine = expectedAineOptions.map { it.toString() }
        )

        assertEquals(expectedFilterOptions, instructionsOut.instructionFilterOptions)

        val actualNumbersInName = instructionsOut.content.flatMap { instruction ->
            Regex("\\d+").findAll(instruction.nameFi).map { it.value.toInt() }.toList()
        }
        assertEquals(expectedNumbersInList, actualNumbersInName)
    }

    @Test
    @WithOpettajaRole
    fun `get suko instruction list as opettaja while filtering`() {
        val filters = SukoInstructionFilters(
            jarjesta = "asc"
        )
        val instructionsOut: SukoInstructionListDtoOut = getAllInstructions(filters)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.SUKO },
            "Wrong exam in list, expected: ${Exam.SUKO}, got ${instructionsOut.content.map { it.exam }}"
        )

        assertEquals(0, instructionsOut.instructionFilterOptions.dummy)
    }

    @Test
    @WithOpettajaRole
    fun `get ld instruction list as opettaja while filtering`() {
        val filters = LdInstructionFilters(
            jarjesta = "asc",
            aine = null
        )

        assertFilteredLdInstructionList(filters, 8, listOf(4, 5, 6, 7, 8, 9, 10, 11), listOf(1, 2, 3, 5, 6, 7, 8, 9))
        assertFilteredLdInstructionList(filters.copy(aine = "1"), 1, listOf(9), listOf(1))
        assertFilteredLdInstructionList(filters.copy(aine = "9"), 1, listOf(8), listOf(9))
        assertFilteredLdInstructionList(filters.copy(aine = "1,9"), 2, listOf(8, 9), listOf(1, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = "desc", aine = "1,9"), 2, listOf(9, 8), listOf(1, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = null, aine = "1,9"), 2, listOf(8, 9), listOf(1, 9))
    }

    @Test
    @WithOpettajaRole
    fun `get puhvi instruction list as opettaja while filtering`() {
        val filters = PuhviInstructionFilters(
            jarjesta = "asc",
        )

        val instructionsOut: PuhviInstructionListDtoOut = getAllInstructions(filters)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.PUHVI },
            "Wrong exam in list, expected: ${Exam.PUHVI}, got ${instructionsOut.content.map { it.exam }}"
        )

        assertEquals(0, instructionsOut.instructionFilterOptions.dummy)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `only latest versions of assignments in get all assignment data`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createInstruction = when (exam!!) {
                    Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(
                        mapper.writeValueAsString(
                            minimalSukoInstruction
                        )
                    )

                    Exam.LD -> createInstruction<LdInstructionDtoOut>(mapper.writeValueAsString(minimalLdInstruction))
                    Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(
                        mapper.writeValueAsString(
                            minimalPuhviInstruction
                        )
                    )
                }

                val updateInstructionIn = when (exam) {
                    Exam.SUKO -> minimalSukoInstruction.copy(nameFi = createInstruction.nameFi + " updated")
                    Exam.LD -> minimalLdInstruction.copy(nameFi = createInstruction.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviInstruction.copy(nameFi = createInstruction.nameFi + " updated")
                }

                performInstructionUpdate(
                    createInstruction.id,
                    mapper.writeValueAsString(updateInstructionIn),
                )

                val instructions = when (exam) {
                    Exam.SUKO -> getAllInstructions<SukoInstructionFilters, SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>()
                    Exam.LD -> getAllInstructions<LdInstructionFilters, LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>()
                    Exam.PUHVI -> getAllInstructions<PuhviInstructionFilters, PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>()
                }.content

                assertEquals(instructions.size, instructions.distinctBy { it.id }.size)
                assertEquals(2, instructions.find { it.id == createInstruction.id }!!.version)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `updating instruction saves updater oid`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val instructionIn = when (exam!!) {
                    Exam.SUKO -> minimalSukoInstruction
                    Exam.LD -> minimalLdInstruction
                    Exam.PUHVI -> minimalPuhviInstruction
                }

                val createdInstruction = createInstruction<InstructionOut>(mapper.writeValueAsString(instructionIn))

                assertThat(createdInstruction.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(createdInstruction.updaterOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)

                val updatedInstructionIn = when (exam) {
                    Exam.SUKO -> minimalSukoInstruction.copy(nameFi = instructionIn.nameFi + " updated")
                    Exam.LD -> minimalLdInstruction.copy(nameFi = instructionIn.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviInstruction.copy(nameFi = instructionIn.nameFi + " updated")
                }
                performInstructionUpdate(
                    createdInstruction.id,
                    mapper.writeValueAsString(updatedInstructionIn),
                    emptyList(),
                    emptyList(),
                    yllapitaja2User
                )

                val updatedInstruction = when (exam) {
                    Exam.SUKO -> performGetInstructionById<SukoInstructionDtoOut>(createdInstruction.id)
                    Exam.LD -> performGetInstructionById<LdInstructionDtoOut>(createdInstruction.id)
                    Exam.PUHVI -> performGetInstructionById<PuhviInstructionDtoOut>(createdInstruction.id)
                }

                assertThat(updatedInstruction.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(updatedInstruction.updaterOid).isEqualTo(Yllapitaja2SecurityContextFactory().kayttajatiedot().oidHenkilo)
            }
        }

    private fun getMinimalInstructionInByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> minimalSukoInstruction
        Exam.LD -> minimalLdInstruction
        Exam.PUHVI -> minimalPuhviInstruction
    }

    private fun getAllInstructionVersionsByExam(exam: Exam, id: Int) = when (exam) {
        Exam.SUKO -> getAllInstructionVersions<SukoInstructionDtoOut>(id)
        Exam.LD -> getAllInstructionVersions<LdInstructionDtoOut>(id)
        Exam.PUHVI -> getAllInstructionVersions<PuhviInstructionDtoOut>(id)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all versions and a certain version of instruction for different exams`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam get all versions and a certain version of assignment") {
                val createdInstruction = createInstructionByExam(exam)
                val instructions = createFourCopiesOfInstruction(exam, createdInstruction)

                updateInstructionWithVaryingAttachments(instructions, createdInstruction)
                assertUpdatedInstruction(instructions, exam, createdInstruction)

                val kayttajatiedot = YllapitajaSecurityContextFactory().kayttajatiedot()
                val expectedUpdaterName = "${kayttajatiedot.etunimet} ${kayttajatiedot.sukunimi}"
                getAllInstructionVersionsByExam(exam, createdInstruction.id).let { instructionVersions ->
                    assertEquals(5, instructionVersions.size)
                    instructionVersions.forEachIndexed { index, instruction ->
                        assertThat(instruction.updaterName).isEqualTo(expectedUpdaterName)
                        if (index == 0) {
                            assertFieldsInAndOutEqual(getMinimalInstructionInByExam(exam), instruction)
                            assertEquals(instruction.attachments[0].name, "fixture1.pdf")
                            assertEquals(instruction.attachments[0].instructionVersion, 1)
                        } else {
                            assertFieldsInAndOutEqual(instructions[index - 1], instruction)
                        }
                    }
                }
            }
        }

    private fun createInstructionByExam(exam: Exam): InstructionOut {
        val attachments = listOf(
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture1.pdf", "attachments"),
                InstructionAttachmentMetadataDtoIn(null, "fixture1.pdf", Language.FI, 1)
            )
        )

        val createdInstruction = when (exam) {
            Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(
                mapper.writeValueAsString(minimalSukoInstruction),
                attachments
            )

            Exam.LD -> createInstruction<LdInstructionDtoOut>(
                mapper.writeValueAsString(minimalLdInstruction),
                attachments
            )

            Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(
                mapper.writeValueAsString(minimalPuhviInstruction),
                attachments
            )
        }

        return createdInstruction
    }

    private fun updateInstructionWithVaryingAttachments(
        instructions: List<TestInstruction>,
        createdInstruction: InstructionOut
    ) = instructions.forEachIndexed { index, instruction ->
        val newAttachments: List<InstructionAttachmentIn> = listOf(
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture2.pdf", "new-attachments"),
                InstructionAttachmentMetadataDtoIn(null, "fixture2.pdf", Language.FI, 1)
            )
        )

        val currentAttachmentMetadata = createdInstruction.attachments.map {
            InstructionAttachmentMetadataDtoIn(
                it.fileKey,
                it.name,
                it.language,
                it.instructionVersion
            )
        }

        val (toUpdate, toAdd) = when (index) {
            0 -> Pair(currentAttachmentMetadata, emptyList())
            1, 2 -> Pair(currentAttachmentMetadata, newAttachments)
            3 -> Pair(emptyList(), newAttachments)
            else -> throw Exception("Invalid index")
        }

        performInstructionUpdate(
            createdInstruction.id,
            mapper.writeValueAsString(instruction),
            toUpdate,
            toAdd
        )
    }

    private fun assertUpdatedInstruction(
        instructions: List<TestInstruction>,
        exam: Exam,
        createdInstruction: InstructionOut
    ) = instructions.forEachIndexed { index, instruction ->
        val version = index + 2
        val instructionById = getInstructionByIdAndExam(exam, createdInstruction, version)

        assertFieldsInAndOutEqual(instruction, instructionById)

        when (index) {
            0 -> {
                assertEquals(instructionById.attachments.size, 1)
                assertEquals(instructionById.attachments[0].name, "fixture1.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
            }

            1, 2 -> {
                assertEquals(instructionById.attachments.size, 2)
                assertEquals(instructionById.attachments[0].name, "fixture2.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
                assertEquals(instructionById.attachments[1].name, "fixture1.pdf")
                assertEquals(instructionById.attachments[1].instructionVersion, version)
            }

            3 -> {
                assertEquals(instructionById.attachments.size, 1)
                assertEquals(instructionById.attachments[0].name, "fixture2.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
            }

            else -> throw Exception("Invalid index")
        }
    }

    private fun getInstructionByIdAndExam(
        exam: Exam?,
        createdInstruction: InstructionOut,
        version: Int
    ): InstructionOut = when (exam!!) {
        Exam.SUKO -> performGetInstructionById<SukoInstructionDtoOut>(createdInstruction.id, version)
        Exam.LD -> performGetInstructionById<LdInstructionDtoOut>(createdInstruction.id, version)
        Exam.PUHVI -> performGetInstructionById<PuhviInstructionDtoOut>(createdInstruction.id, version)
    }

    private fun createFourCopiesOfInstruction(
        exam: Exam,
        createdInstruction: InstructionOut
    ): List<TestInstruction> = (1..4).map { index ->
        when (exam) {
            Exam.SUKO -> minimalSukoInstruction.copy(nameFi = createdInstruction.nameFi + " updated$index")
            Exam.LD -> minimalLdInstruction.copy(nameFi = createdInstruction.nameFi + " updated$index")
            Exam.PUHVI -> minimalPuhviInstruction.copy(nameFi = createdInstruction.nameFi + " updated$index")
        }
    }


    @Test
    @WithYllapitajaRole
    fun createInstructionWithBothNamesBlank() {
        val responseContent = mockMvc.perform(
            createInstructionReq(
                mapper.writeValueAsString(minimalSukoInstruction.copy(nameFi = "")),
                emptyList()
            )
        ).andExpect(status().isBadRequest).andReturn().response.contentAsString
        assertThat(responseContent).isEqualTo("Global error: At least one of the name fields must be non-empty")
    }

    @Test
    @WithYllapitajaRole
    fun updateInstructionWithNonExistentId() {
        val nonExistentId = -1
        val failUpdate = mockMvc.perform(
            updateInstructionReq(
                nonExistentId,
                mapper.writeValueAsString(minimalSukoInstruction),
                emptyList(),
                emptyList()
            )
        ).andReturn().response.contentAsString

        assertEquals("Instruction $nonExistentId not found", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidExam() {
        val body = mapper.writeValueAsString(minimalSukoInstruction).replace("SUKO", "WRONG")
        val responseContent =
            mockMvc.perform(createInstructionReq(body, emptyList())).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidPublishState() {
        val body = mapper.writeValueAsString(minimalSukoInstruction).replace("PUBLISHED", "WRONG")
        val responseContent =
            mockMvc.perform(createInstructionReq(body, emptyList())).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"WRONG\": not one of the values accepted for Enum class")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionByNonExistentId() {
        val getResult = mockMvc.perform(getInstructionByIdReq(Exam.SUKO, -1)).andExpect(status().isNotFound())
            .andReturn().response.contentAsString
        assertThat(getResult).isEqualTo("Instruction -1 not found")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionsAsYllapitaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(12)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(8)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsDraftAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        val idsOfDrafts = instructions.content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

        idsOfDrafts.forEach { mockMvc.perform(getInstructionByIdReq(Exam.SUKO, it)).andExpect(status().isNotFound()) }
    }

    @Test
    @WithOpettajaRole
    fun opettajaCannotCallYllapitajaRoutes() {
        val instructionInStr = mapper.writeValueAsString(minimalSukoInstruction)
        mockMvc.perform(createInstructionReq(instructionInStr, emptyList())).andExpect(status().isUnauthorized())
        mockMvc.perform(updateInstructionReq(1, instructionInStr, emptyList(), emptyList()))
            .andExpect(status().isUnauthorized())
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a instruction`() {
        val (id) = createInstruction<SukoInstructionDtoOut>(
            mapper.writeValueAsString(minimalSukoInstruction),
            emptyList()
        )

        performInstructionUpdate(
            id,
            mapper.writeValueAsString(minimalSukoInstruction.copy(publishState = PublishState.DELETED)),
        )
        mockMvc.perform(getInstructionByIdReq(Exam.SUKO, (id))).andExpect(status().isNotFound)

        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        val noneHaveMatchingId = instructions.content.none { it.id == (id) }

        assertTrue(noneHaveMatchingId, "No instructions should have the ID of the deleted one")
    }

    @Test
    @WithYllapitajaRole
    fun `Test image html validator`() {
        createInstruction<SukoInstructionDtoOut>(
            mapper.writeValueAsString(
                minimalSukoInstruction.copy(
                    contentFi = "<p>Text before image</p><img src=\"/api/image?fileKey=image_123\" alt=\"Alt text\" class=\"image-size-large image-align-left\" /><p>Text after</p>"
                )
            )
        )
    }
}
