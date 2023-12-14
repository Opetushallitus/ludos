package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumeroRekisteriHenkilo
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

const val attachmentFileNameToCreate = "fixture1.pdf"
const val attachmentFileNameToCreateSv = "fixture2.pdf"
const val attachmentFileNameToUpdate = "fixture2.pdf"
const val attachmentFileNameToUpdateSv = "fixture3.pdf"

val sukoCertificateToCreate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI",
    "",
    "Certificate content FI",
    "",
    TestPublishState.PUBLISHED,
)

val sukoCertificateToUpdate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI updated",
    "",
    "Certificate content FI updated",
    "",
    TestPublishState.PUBLISHED,
)

val puhviCertificateToCreate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI",
    "Test Certificate SV",
    "Certificate content Fi",
    "Certificate content SV",
    TestPublishState.PUBLISHED,
)

val puhviCertificateToUpdate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    "Certificate content FI updated",
    "Certificate content SV updated",
    TestPublishState.PUBLISHED,
)

val ldCertificateToCreate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI",
    "Test Certificate SV",
    TestPublishState.PUBLISHED,
    "1"
)

val ldCertificateToUpdate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    TestPublishState.PUBLISHED,
    "2"
)

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CertificateControllerTest : CertificateRequests() {
    @MockBean
    private lateinit var mockOppijanumerorekisteriClient: OppijanumerorekisteriClient

    val fileKeyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()

    @BeforeEach
    fun setupMocks() {
        Mockito.`when`(mockOppijanumerorekisteriClient.getUserDetailsByOid(anyString()))  // when does not work inside BeforeAll
            .thenReturn(OppijanumeroRekisteriHenkilo(YllapitajaSecurityContextFactory().kayttajatiedot()))
    }

    private fun validateFileKey(fileKey: String) =
        assertTrue(fileKey.matches(fileKeyRegex), "Invalid fileKey: $fileKey")

    private fun assertGetReturnsExpectedAttachment(
        fileKey: String, expectedFileName: String, expectedFileContent: ByteArray
    ) {
        val attachmentGetResponse =
            mockMvc.perform(getAttachment(fileKey)).andExpect(status().isOk).andReturn().response

        assertArrayEquals(expectedFileContent, attachmentGetResponse.contentAsByteArray)
        assertEquals("application/pdf", attachmentGetResponse.contentType)
        assertEquals(
            "inline; filename=\"${expectedFileName}\"", attachmentGetResponse.getHeader("content-disposition")
        )
    }

    private fun assertAttachment(
        expectedAttachmentName: String,
        updatedAttachmentDtoOut: CertificateAttachmentDtoOut,
    ) {
        assertEquals(expectedAttachmentName, updatedAttachmentDtoOut.fileName)
        validateFileKey(updatedAttachmentDtoOut.fileKey)
        assertNotNull(updatedAttachmentDtoOut.fileUploadDate)

        assertGetReturnsExpectedAttachment(
            updatedAttachmentDtoOut.fileKey,
            expectedAttachmentName,
            readAttachmentFixtureFile(expectedAttachmentName).bytes
        )
    }

    private fun assertPuhviDescription(dtoIn: TestPuhviCertificateIn, dtoOut: PuhviCertificateDtoOut) {
        assertEquals(dtoIn.descriptionFi, dtoOut.descriptionFi)
        assertEquals(dtoIn.descriptionSv, dtoOut.descriptionSv)
    }

    private fun assertCommonFields(
        dtoIn: TestCertificate,
        dtoOut: CertificateOut,
        newAttachment: String,
        newAttachmentSv: String,
        expectedVersion: Int
    ) {
        assertNotNull(dtoOut.id)
        assertEquals(dtoIn.exam, dtoOut.exam)
        assertEquals(dtoIn.publishState.toString(), dtoOut.publishState.toString())
        assertEquals(dtoIn.nameFi, dtoOut.nameFi)
        assertEquals(dtoIn.nameSv, dtoOut.nameSv)
        assertEquals(expectedVersion, dtoOut.version)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, dtoOut.authorOid)
        assertNotNull(dtoOut.createdAt)
        assertNotNull(dtoOut.updatedAt)

        assertAttachment(
            newAttachment,
            dtoOut.attachmentFi
        )
        if ((dtoIn.exam != Exam.SUKO)) {
            assertAttachment(
                newAttachmentSv,
                dtoOut.attachmentSv
            )
        }

        when (dtoOut) {
            is SukoCertificateDtoOut -> {
                dtoIn as TestSukoCertificateIn
                assertEquals(dtoIn.descriptionFi, dtoOut.descriptionFi)
            }

            is LdCertificateDtoOut -> {
                dtoIn as TestLdCertificateIn
                assertEquals(dtoIn.aineKoodiArvo, dtoOut.aineKoodiArvo)
            }

            is PuhviCertificateDtoOut -> {
                dtoIn as TestPuhviCertificateIn
                assertPuhviDescription(dtoIn, dtoOut)
            }
        }
    }

    private inline fun <reified T : CertificateOut> createCertificateAndCheckIt(
        certificateToCreate: TestCertificate,
    ): T {
        val attachmentFileName = attachmentFileNameToCreate
        val attachmentFileNameSv = attachmentFileNameToCreateSv

        val certificateToCreateStr = mapper.writeValueAsString(certificateToCreate)
        val createdCertificateStr =
            mockMvc.perform(postCertificate(certificateToCreateStr, attachmentFileName, attachmentFileNameSv))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString

        val createdCertificate = mapper.readValue<T>(createdCertificateStr)

        assertCommonFields(certificateToCreate, createdCertificate, attachmentFileName, attachmentFileNameSv, 1)

        val certificateById = getCertificateById<T>(createdCertificate.id)

        assertCommonFields(certificateToCreate, certificateById, attachmentFileName, attachmentFileNameSv, 1)

        return certificateById
    }

    private fun updateCertificateAndCheckIt(
        createdCertificate: CertificateOut,
        editedCertificate: TestCertificate,
        updaterUser: RequestPostProcessor = yllapitajaUser
    ): CertificateOut {
        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachment = readAttachmentFixtureFile(attachmentFileNameToUpdate)
        val newAttachmentSv = readAttachmentFixtureFile(attachmentFileNameToUpdateSv, "attachmentSv")

        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment,
                newAttachmentSv
            ).with(updaterUser)
        ).andExpect(status().isOk)

        val updatedCertificateById: CertificateOut = mapper.readValue(
            mockMvc.perform(getCertificateByIdReq(createdCertificate.exam, createdCertificate.id))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertCommonFields(
            editedCertificate,
            updatedCertificateById,
            attachmentFileNameToUpdate,
            attachmentFileNameToUpdateSv,
            2
        )

        return updatedCertificateById
    }

    private fun createCertificateByExamAndCheckIt(exam: Exam): CertificateOut =
        when (exam) {
            Exam.SUKO -> createCertificateAndCheckIt<SukoCertificateDtoOut>(sukoCertificateToCreate)
            Exam.LD -> createCertificateAndCheckIt<LdCertificateDtoOut>(ldCertificateToCreate)
            Exam.PUHVI -> createCertificateAndCheckIt<PuhviCertificateDtoOut>(puhviCertificateToCreate)
        }

    private fun updateCertificateByExamAndCheckIt(
        exam: Exam,
        createdCert: CertificateOut
    ): CertificateOut =
        when (exam) {
            Exam.SUKO -> updateCertificateAndCheckIt(createdCert, sukoCertificateToUpdate, yllapitaja2User)
            Exam.LD -> updateCertificateAndCheckIt(createdCert, ldCertificateToUpdate, yllapitaja2User)
            Exam.PUHVI -> updateCertificateAndCheckIt(createdCert, puhviCertificateToUpdate, yllapitaja2User)
        }

    @TestFactory
    @WithYllapitajaRole
    fun `publish certificates`(): Collection<DynamicTest> = Exam.entries.map { exam ->
        DynamicTest.dynamicTest("$exam") {
            createCertificateByExamAndCheckIt(exam)
        }
    }

    @TestFactory
    @WithYllapitajaRole
    fun `updating certificate saves updater oid`(): Collection<DynamicTest> = Exam.entries.map { exam ->
        DynamicTest.dynamicTest("$exam") {
            val createdCert = createCertificateByExamAndCheckIt(exam)
            val updatedCert = updateCertificateByExamAndCheckIt(exam, createdCert)
            assertThat(
                updatedCert.updaterOid,
                CoreMatchers.equalTo(Yllapitaja2SecurityContextFactory().kayttajatiedot().oidHenkilo)
            )
        }
    }

    @TestFactory
    @WithYllapitajaRole
    fun `create draft and publish certificates and update attachments`(): Collection<DynamicTest> =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val (createdCertificate, editedCertificate) = when (exam) {
                    Exam.SUKO -> Pair(
                        createCertificateAndCheckIt<SukoCertificateDtoOut>(
                            sukoCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        sukoCertificateToUpdate
                    )

                    Exam.LD -> Pair(
                        createCertificateAndCheckIt<LdCertificateDtoOut>(
                            ldCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        ldCertificateToUpdate
                    )

                    Exam.PUHVI -> Pair(
                        createCertificateAndCheckIt<PuhviCertificateDtoOut>(
                            puhviCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        puhviCertificateToUpdate
                    )
                }

                when (val updatedCertificateById = updateCertificateAndCheckIt(createdCertificate, editedCertificate)) {
                    is SukoCertificateDtoOut -> assertEquals(
                        (editedCertificate as TestSukoCertificateIn).descriptionFi,
                        updatedCertificateById.descriptionFi
                    )

                    is LdCertificateDtoOut -> assertEquals(
                        (editedCertificate as TestLdCertificateIn).aineKoodiArvo,
                        updatedCertificateById.aineKoodiArvo
                    )

                    is PuhviCertificateDtoOut -> assertPuhviDescription(
                        editedCertificate as TestPuhviCertificateIn,
                        updatedCertificateById
                    )
                }
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `get specific versions and all versions of a certificate`(): Collection<DynamicTest> =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdCertificate = createCertificateByExamAndCheckIt(exam)

                // luo 4 uutta versiota
                val certificateVersionsIn = (2..5).map { index ->
                    when (exam) {
                        Exam.SUKO -> sukoCertificateToCreate.copy(nameFi = createdCertificate.nameFi + " v" + index)
                        Exam.LD -> ldCertificateToCreate.copy(nameFi = createdCertificate.nameFi + " v" + index)
                        Exam.PUHVI -> puhviCertificateToCreate.copy(nameFi = createdCertificate.nameFi + " v" + index)
                    }
                }
                certificateVersionsIn.forEachIndexed { index, certificateIn ->
                    val newAttachment = if (index == certificateVersionsIn.lastIndex) {
                        readAttachmentFixtureFile(attachmentFileNameToUpdate)
                    } else null

                    mockMvc.perform(
                        putCertificate(
                            createdCertificate.id,
                            mapper.writeValueAsString(certificateIn),
                            newAttachment,
                            if (exam != Exam.SUKO) newAttachment else null
                        )
                    ).andExpect(status().isOk)
                }

                // gettaa ja asserttaa luodut versiot
                certificateVersionsIn.forEachIndexed { index, certificateIn ->
                    val version = index + 2
                    val certificateVersionById = getCertificateById(exam, createdCertificate.id, version)

                    assertEquals(certificateIn.nameFi, certificateVersionById.nameFi)
                    assertEquals(version, certificateVersionById.version)

                    if (index == certificateVersionsIn.lastIndex) {
                        assertAttachment(attachmentFileNameToUpdate, certificateVersionById.attachmentFi)
                    } else {
                        assertAttachment(attachmentFileNameToCreate, certificateVersionById.attachmentFi)
                    }

                    if (certificateIn.exam != Exam.SUKO) {
                        assertAttachment(attachmentFileNameToCreateSv, certificateVersionById.attachmentSv)
                    }
                }

                testVersionsEndpoint(exam, createdCertificate, certificateVersionsIn)
            }
        }

    private fun testVersionsEndpoint(
        exam: Exam,
        createdCertificate: CertificateOut,
        certificates: List<TestCertificate>
    ) {
        val allCertificateVersionsByExam = getAllCertificateVersions(exam, createdCertificate.id)

        val certificateInByExam = when (exam) {
            Exam.SUKO -> sukoCertificateToCreate
            Exam.LD -> ldCertificateToCreate
            Exam.PUHVI -> puhviCertificateToCreate
        }

        val kayttajatiedot = YllapitajaSecurityContextFactory().kayttajatiedot()
        val expectedUpdaterName = "${kayttajatiedot.etunimet} ${kayttajatiedot.sukunimi}"
        allCertificateVersionsByExam.let { certificateVersions ->
            assertEquals(5, certificateVersions.size)
            certificateVersions.forEachIndexed { index, certificate ->
                Assertions.assertThat(certificate.updaterName).isEqualTo(expectedUpdaterName)
                val expectedCertificate = if (index == 0) certificateInByExam else certificates[index - 1]
                val expectedAttachment =
                    if (index == certificateVersions.lastIndex) attachmentFileNameToUpdate else attachmentFileNameToCreate
                val expectedAttachmentSv =
                    if (index == certificateVersions.lastIndex) attachmentFileNameToUpdate else attachmentFileNameToCreateSv

                assertCommonFields(
                    expectedCertificate,
                    certificate,
                    expectedAttachment,
                    expectedAttachmentSv,
                    index + 1
                )
            }
        }
    }


    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() = assertEquals(
        "Certificate -1 not found",
        mockMvc.perform(putCertificate(-1, mapper.writeValueAsString(sukoCertificateToCreate)))
            .andExpect(status().isNotFound)
            .andReturn().response.contentAsString
    )

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidExam() {
        val body = mapper.writeValueAsString(sukoCertificateToCreate).replace("\"SUKO\"", "\"WRONG\"")

        val postResponseBody =
            mockMvc.perform(postCertificate(body, attachmentFileNameToCreate)).andExpect(status().isBadRequest)
                .andReturn().response.contentAsString
        assertThat(
            postResponseBody,
            CoreMatchers.containsString("Invalid type: JSON parse error: Could not resolve type id 'WRONG' as a subtype of `fi.oph.ludos.certificate.Certificate`: known type ids = [LD, PUHVI, SUKO]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithMissingAttachment() =
        assertThat(
            mockMvc.perform(postCertificate(mapper.writeValueAsString(sukoCertificateToCreate), null))
                .andExpect(status().isBadRequest)
                .andReturn().response.contentAsString, emptyString()
        )

    @Test
    @WithYllapitajaRole
    fun putCertificateWithInvalidPublishState() {
        val createdCertificateOut = createCertificateAndCheckIt<SukoCertificateDtoOut>(sukoCertificateToCreate)

        val body = mapper.writeValueAsString(sukoCertificateToCreate.copy(publishState = TestPublishState.OLEMATON))

        val putResponseBody = mockMvc.perform(putCertificate(createdCertificateOut.id, body))
            .andExpect(status().isBadRequest)
            .andReturn().response.contentAsString

        assertThat(
            putResponseBody,
            CoreMatchers.containsString("String \"OLEMATON\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED, DELETED]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() = assertEquals(
        "Certificate 999 not found",
        mockMvc.perform(getCertificateByIdReq(Exam.SUKO, 999))
            .andExpect(status().isNotFound())
            .andReturn().response.contentAsString
    )

    private inline fun <reified T : TestCertificate, reified Y : CertificateOut> deleteCertificateTest(
        exam: Exam,
        certificateInInput: T,
        updates: List<(Y) -> T>,
        updateCertificate: (Y) -> T
    ) {
        val createdCertificateOut = createCertificateAndCheckIt<Y>(certificateInInput)

        updates.forEach { updateFunction ->
            val updatedCertificateIn = updateFunction(createdCertificateOut)
            mockMvc.perform(
                putCertificate(
                    createdCertificateOut.id,
                    mapper.writeValueAsString(updatedCertificateIn),
                    null,
                    null
                )
            ).andExpect(status().isOk)
        }

        mockMvc.perform(
            putCertificate(
                createdCertificateOut.id,
                mapper.writeValueAsString(updateCertificate(createdCertificateOut)),
                null,
                null
            )
        ).andExpect(status().isOk)

        mockMvc.perform(getCertificateByIdReq(exam, createdCertificateOut.id))
            .andExpect(status().isNotFound())

        val certificates = getAllCertificates(exam)
        assertTrue(
            certificates.none { it.id == createdCertificateOut.id },
            "No certificate should have the ID of the deleted one"
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting SUKO certificate`() = deleteCertificateTest<TestSukoCertificateIn, SukoCertificateDtoOut>(
        Exam.SUKO,
        sukoCertificateToCreate,
        listOf(
            { sukoCertificateToCreate.copy(nameFi = "updated") },
            { sukoCertificateToCreate.copy(nameFi = "updated1") },
        )
    ) {
        TestSukoCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            TestPublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting PUHVI certificate`() = deleteCertificateTest<TestPuhviCertificateIn, PuhviCertificateDtoOut>(
        Exam.PUHVI,
        puhviCertificateToCreate,
        listOf(
            { puhviCertificateToCreate.copy(nameFi = "updated") },
            { puhviCertificateToCreate.copy(nameFi = "updated1") },
        )
    ) {
        TestPuhviCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            TestPublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting LD certificate`() = deleteCertificateTest<TestLdCertificateIn, LdCertificateDtoOut>(
        Exam.LD,
        ldCertificateToCreate,
        listOf(
            { ldCertificateToCreate.copy(nameFi = "updated") },
            { ldCertificateToCreate.copy(nameFi = "updated1") },
        )
    ) {
        TestLdCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            TestPublishState.DELETED,
            it.aineKoodiArvo
        )
    }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring current version yields 400`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdCertificate = createCertificateByExamAndCheckIt(exam)
                val errorMessage =
                    mockMvc.perform(restoreCertificateReq(exam, createdCertificate.id, createdCertificate.version))
                        .andExpect(status().isBadRequest).andReturn().response.contentAsString
                assertEquals("Cannot restore latest version", errorMessage)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring non-existent certificate id yields 404`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                mockMvc.perform(restoreCertificateReq(exam, -1, 1))
                    .andExpect(status().isNotFound)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring non-existent version yields 404`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdCertificate = createCertificateByExamAndCheckIt(exam)
                mockMvc.perform(restoreCertificateReq(exam, createdCertificate.id, -1))
                    .andExpect(status().isNotFound)
            }
        }


    @TestFactory
    @WithYllapitajaRole
    fun `restoring an old version creates a new version`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdCertificate = createCertificateByExamAndCheckIt(exam)
                updateCertificateByExamAndCheckIt(exam, createdCertificate)
                val updatedCertificateById = getCertificateById(exam, createdCertificate.id)
                assertNotEquals(createdCertificate.nameFi, updatedCertificateById.nameFi)

                val versionsBeforeRestore = getAllCertificateVersions(exam, createdCertificate.id)
                assertEquals(2, versionsBeforeRestore.size)

                mockMvc.perform(restoreCertificateReq(exam, createdCertificate.id, createdCertificate.version))
                    .andExpect(status().isOk)
                val versionsAfterRestore = getAllCertificateVersions(exam, createdCertificate.id)
                val latestVersionById = getCertificateById(exam, createdCertificate.id)
                assertEquals(3, versionsAfterRestore.size)
                assertEquals(versionsAfterRestore.last().version, latestVersionById.version)
                assertEquals(3, latestVersionById.version)

                assertEquals(createdCertificate.nameFi, latestVersionById.nameFi)
            }
        }
}
