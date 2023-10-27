package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CertificateControllerTest : CertificateRequests() {
    var idsOfSukoCertificateDrafts = listOf<Int>()
    var idsOfLdCertificateDrafts = listOf<Int>()
    var idsOfPuhviCertificateDrafts = listOf<Int>()

    val fileKeyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()
    val exams = listOf(Exam.SUKO, Exam.PUHVI, Exam.LD)

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

    private fun assertCommonFields(
        dtoIn: TestCertificate,
        dtoOut: TestCertificateOut,
        attachmentFileName: String = "fixture1.pdf"
    ) {
        assertNotNull(dtoOut.id)
        assertEquals(dtoIn.name, dtoOut.name)
        assertEquals(dtoIn.exam, dtoOut.exam)
        assertEquals(dtoIn.publishState, dtoOut.publishState)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, dtoOut.authorOid)
        assertEquals(dtoOut.attachment.fileName, attachmentFileName)
        validateFileKey(dtoOut.attachment.fileKey)
        assertNotNull(dtoOut.attachment.fileUploadDate)
        assertNotNull(dtoOut.createdAt)
        assertNotNull(dtoOut.updatedAt)
    }

    private fun <T : TestCertificateOut> createCertificateAndCheckIt(
        certificateToCreate: TestCertificate,
        expectedDtoClass: Class<T>,
        additionalAssertions: (T) -> Unit = {}
    ): T {
        val attachmentFileName = "fixture1.pdf"
        val certificateToCreateStr = mapper.writeValueAsString(certificateToCreate)

        val attachmentPart = readAttachmentFixtureFile(attachmentFileName)
        val createdCertificateStr =
            mockMvc.perform(postCertificate(certificateToCreateStr, attachmentPart)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val createdCertificate = mapper.readValue(createdCertificateStr, expectedDtoClass)

        assertCommonFields(certificateToCreate, createdCertificate)
        additionalAssertions(createdCertificate)

        val getResult = mockMvc.perform(getCertificateById(certificateToCreate.exam, createdCertificate.id))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateById = mapper.readValue(getResult, expectedDtoClass)

        assertCommonFields(certificateToCreate, certificateById)
        additionalAssertions(createdCertificate)

        assertGetReturnsExpectedAttachment(
            certificateById.attachment.fileKey, attachmentFileName, attachmentPart.bytes
        )

        return certificateById
    }

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDbRequest())
        mockMvc.perform(seedDbWithCertificates())
    }

    @Test
    @WithYllapitajaRole
    fun `get all certificates of each exam`() {
        for (exam in Exam.entries) {
            val res = mockMvc.perform(getAllCertificates(exam)).andExpect(status().isOk())
                .andReturn().response.contentAsString

            val content = if (exam == Exam.LD) {
                getAllCertificatesContent<TestLdCertificateDtoOut>(res)
            } else {
                getAllCertificatesContent<TestSukoOrPuhviCertificateDtoOut>(res)
            }

            assertEquals(4, content.size)

            when (exam) {
                Exam.SUKO -> idsOfSukoCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

                Exam.PUHVI -> idsOfPuhviCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

                Exam.LD -> idsOfLdCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }
            }
        }
    }

    @Test
    @WithYllapitajaRole
    fun publishCertificate() {
        for (exam in exams) {
            if (exam == Exam.LD) {
                createCertificateAndCheckIt(
                    TestLdCertificateIn(
                        exam = exam,
                        name = "Test Certificate FI",
                        publishState = PublishState.PUBLISHED,
                        aineKoodiArvo = "1"
                    ),
                    TestLdCertificateDtoOut::class.java
                ) {
                    assertEquals("1", it.aineKoodiArvo)
                }
            } else {
                createCertificateAndCheckIt(
                    TestSukoOrPuhviCertificateIn(
                        exam = exam,
                        name = "Test Certificate FI",
                        description = "Certificate content Fi",
                        publishState = PublishState.PUBLISHED,
                    ), TestSukoOrPuhviCertificateDtoOut::class.java
                ) {
                    assertEquals("Certificate content Fi", it.description)
                }
            }
        }
    }

    @Test
    @WithYllapitajaRole
    fun `create draft SUKO and PUHVI certificate and publish certificate without updating attachment`() {
        for (exam in listOf(Exam.SUKO, Exam.PUHVI)) {
            val createdCertificate = createCertificateAndCheckIt(
                TestSukoOrPuhviCertificateIn(
                    exam = exam,
                    name = "Test $exam Certificate FI",
                    description = "Certificate content Fi",
                    publishState = PublishState.PUBLISHED,
                ), TestSukoOrPuhviCertificateDtoOut::class.java
            ) {
                assertEquals("Certificate content Fi", it.description)
            }

            val editedCertificate = TestSukoOrPuhviCertificateIn(
                exam = exam,
                name = "Test $exam Certificate FI updated",
                description = "Certificate content Fi updated",
                publishState = PublishState.PUBLISHED,
            )

            val editedCertificateStr = mapper.writeValueAsString(editedCertificate)

            mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, null)).andExpect(status().isOk)
                .andReturn().response.contentAsString

            val updatedCertificateById: TestSukoOrPuhviCertificateDtoOut =
                mapper.readValue(
                    mockMvc.perform(getCertificateById(exam, createdCertificate.id)).andExpect(status().isOk)
                        .andReturn().response.contentAsString
                )

            assertEquals("Certificate content Fi updated", updatedCertificateById.description)
            assertCommonFields(editedCertificate, updatedCertificateById)
        }
    }

    @Test
    @WithYllapitajaRole
    fun `create draft LD certificate and publish certificate without updating attachment`() {
        val exam = Exam.LD

        val createdCertificate = createCertificateAndCheckIt(
            TestLdCertificateIn(
                exam = exam,
                name = "Test Certificate FI",
                publishState = PublishState.PUBLISHED,
                aineKoodiArvo = "1"
            ),
            TestLdCertificateDtoOut::class.java
        ) {
            assertEquals("1", it.aineKoodiArvo)
        }

        val editedCertificate = TestLdCertificateIn(
            exam = exam,
            name = "Test $exam Certificate FI updated",
            publishState = PublishState.PUBLISHED,
            aineKoodiArvo = "2"
        )

        val editedCertificateStr = mapper.writeValueAsString(editedCertificate)

        mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, null)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificateById: TestLdCertificateDtoOut =
            mapper.readValue(
                mockMvc.perform(getCertificateById(exam, createdCertificate.id)).andExpect(status().isOk)
                    .andReturn().response.contentAsString
            )

        assertEquals("2", updatedCertificateById.aineKoodiArvo)
        assertCommonFields(editedCertificate, updatedCertificateById)
    }

    @Test
    @WithYllapitajaRole
    fun `publish and update SUKO and PUHVI certificate with updated attachment`() {
        for (exam in listOf(Exam.SUKO, Exam.PUHVI)) {
            val createdCertificate = createCertificateAndCheckIt(
                TestSukoOrPuhviCertificateIn(
                    exam = exam,
                    name = "Test $exam Certificate FI",
                    description = "Certificate content Fi",
                    publishState = PublishState.PUBLISHED,
                ), TestSukoOrPuhviCertificateDtoOut::class.java
            ) {
                assertEquals("Certificate content Fi", it.description)
            }

            val editedCertificate = TestSukoOrPuhviCertificateIn(
                exam = exam,
                name = "$exam Test Certificate FI updated",
                description = "Certificate content Fi updated",
                publishState = PublishState.PUBLISHED,
            )

            Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
            val newAttachmentFixtureFileName = "fixture2.pdf"
            val newAttachment = readAttachmentFixtureFile(newAttachmentFixtureFileName)
            mockMvc.perform(
                putCertificate(
                    createdCertificate.id,
                    mapper.writeValueAsString(editedCertificate),
                    newAttachment
                )
            )
                .andExpect(status().isOk).andReturn()

            val updatedCertificateById: TestSukoOrPuhviCertificateDtoOut = mapper.readValue(
                mockMvc.perform(getCertificateById(exam, createdCertificate.id)).andExpect(status().isOk)
                    .andReturn().response.contentAsString
            )

            assertEquals("Certificate content Fi updated", updatedCertificateById.description)
            assertCommonFields(editedCertificate, updatedCertificateById, newAttachmentFixtureFileName)

            assertGetReturnsExpectedAttachment(
                updatedCertificateById.attachment.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
            )

            mockMvc.perform(getAttachment(createdCertificate.attachment.fileKey)).andExpect(status().isNotFound)
        }
    }

    @Test
    @WithYllapitajaRole
    fun `publish and update LD certificate with updated attachment`() {
        val exam = Exam.LD

        val createdCertificate = createCertificateAndCheckIt(
            TestLdCertificateIn(
                exam = exam,
                name = "Test Certificate FI",
                publishState = PublishState.PUBLISHED,
                aineKoodiArvo = "1"
            ),
            TestLdCertificateDtoOut::class.java
        ) {
            assertEquals("1", it.aineKoodiArvo)
        }

        val editedCertificate = TestLdCertificateIn(
            exam = exam,
            name = "Test $exam Certificate FI updated",
            publishState = PublishState.PUBLISHED,
            aineKoodiArvo = "2"
        )

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachmentFixtureFileName = "fixture2.pdf"
        val newAttachment = readAttachmentFixtureFile(newAttachmentFixtureFileName)
        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment
            )
        )
            .andExpect(status().isOk).andReturn()

        val updatedCertificateById: TestLdCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(exam, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertEquals("2", updatedCertificateById.aineKoodiArvo)
        assertCommonFields(editedCertificate, updatedCertificateById, newAttachmentFixtureFileName)

        assertGetReturnsExpectedAttachment(
            updatedCertificateById.attachment.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
        )

        mockMvc.perform(getAttachment(createdCertificate.attachment.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificate() {
        createCertificateAndCheckIt(
            TestSukoOrPuhviCertificateIn(
                exam = Exam.SUKO,
                name = "Test Certificate FI",
                description = "Certificate content Fi",
                publishState = PublishState.DRAFT,
            ), TestSukoOrPuhviCertificateDtoOut::class.java
        ) {
            assertEquals("Certificate content Fi", it.description)
        }
    }

    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() {
        val editedCertificate = TestSukoOrPuhviCertificateIn(
            exam = Exam.SUKO,
            name = "Name",
            description = "Description",
            publishState = PublishState.PUBLISHED,
        )
        val editedCertificateStr = mapper.writeValueAsString(editedCertificate)

        val result = mockMvc.perform(putCertificate(-1, editedCertificateStr, null)).andExpect(status().isNotFound)
            .andReturn().response.contentAsString

        assertEquals("Certificate -1 not found", result)
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidExam() {
        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "PUBLISHED",
                "exam": "WRONG"
            }
        """

        val attachmentPart = readAttachmentFixtureFile("fixture1.pdf")
        val postResponseBody = mockMvc.perform(postCertificate(body, attachmentPart)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(
            postResponseBody,
            CoreMatchers.containsString("Invalid type: JSON parse error: Could not resolve type id 'WRONG' as a subtype of `fi.oph.ludos.certificate.Certificate`: known type ids = [LD, PUHVI, SUKO]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithMissingAttachment() {
        val certificateIn = TestSukoOrPuhviCertificateIn(
            exam = Exam.SUKO,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
        )
        val certificateInStr = mapper.writeValueAsString(certificateIn)

        val postResponseBody = mockMvc.perform(postCertificate(certificateInStr, null)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(postResponseBody, emptyString())
    }

    @Test
    @WithYllapitajaRole
    fun putCertificateWithInvalidPublishState() {
        val createdCertificateOut = createCertificateAndCheckIt(
            TestSukoOrPuhviCertificateIn(
                exam = Exam.SUKO,
                name = "Test Certificate FI",
                description = "Certificate content Fi",
                publishState = PublishState.PUBLISHED,
            ), TestSukoOrPuhviCertificateDtoOut::class.java
        )

        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "NON_EXISTENT_PUBLISH_STATE",
                "exam": "PUHVI"
            }
        """

        val putResponseBody =
            mockMvc.perform(putCertificate(createdCertificateOut.id, body, null)).andExpect(status().isBadRequest)
                .andReturn().response.contentAsString
        assertThat(
            putResponseBody,
            CoreMatchers.containsString("String \"NON_EXISTENT_PUBLISH_STATE\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED, DELETED]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() {
        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "Certificate not found 999")
    }

    @Test
    @WithOpettajaRole
    fun getCertificateDraftAsOpettaja() {
        exams.forEach { exam ->
            when (exam) {
                Exam.SUKO -> idsOfSukoCertificateDrafts.forEach() {
                    mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
                }

                Exam.PUHVI -> idsOfPuhviCertificateDrafts.forEach() {
                    mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
                }

                Exam.LD -> idsOfLdCertificateDrafts.forEach() {
                    mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
                }
            }
        }
    }

    @Test
    @WithOpettajaRole
    fun getCertificatesAsOpettaja() {
        val res = mockMvc.perform(getAllCertificates(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val certificates: TestCertificatesOut<TestSukoOrPuhviCertificateDtoOut> = mapper.readValue(res)
        val content = certificates.content

        // make sure that draft certificate is not returned
        assertTrue(
            content.none { it.publishState == PublishState.DRAFT }, "Opettaja should not see draft certificates"
        )

        assertEquals(2, content.size)
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting SUKO and PUHVI certificate`() {
        for (exam in listOf(Exam.SUKO, Exam.PUHVI)) {
            val createdCertificateOut =
                createCertificateAndCheckIt(
                    TestSukoOrPuhviCertificateIn(
                        exam = exam,
                        name = "Test Certificate FI",
                        description = "Certificate content Fi",
                        publishState = PublishState.PUBLISHED,
                    ), TestSukoOrPuhviCertificateDtoOut::class.java
                )

            mockMvc.perform(
                putCertificate(
                    createdCertificateOut.id, mapper.writeValueAsString(
                        TestSukoOrPuhviCertificateIn(
                            exam = createdCertificateOut.exam,
                            name = createdCertificateOut.name,
                            description = createdCertificateOut.description,
                            publishState = PublishState.DELETED,
                        )
                    ), null
                )
            ).andExpect(status().isOk)
                .andReturn().response.contentAsString

            mockMvc.perform(getCertificateById(exam, createdCertificateOut.id)).andExpect(status().isNotFound())

            val certificates: TestCertificatesOut<TestSukoOrPuhviCertificateDtoOut> = mapper.readValue(
                mockMvc.perform(getAllCertificates(exam)).andExpect(status().isOk())
                    .andReturn().response.contentAsString
            )

            val content = certificates.content

            val noneHaveMatchingId = content.none { it.id == createdCertificateOut.id }

            assertTrue(noneHaveMatchingId, "No certificate should have the ID of the deleted one")
        }
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting LD certificate`() {
        val createdCertificateOut =
            createCertificateAndCheckIt(
                TestLdCertificateIn(
                    exam = Exam.LD,
                    name = "Test Certificate FI",
                    publishState = PublishState.PUBLISHED,
                    aineKoodiArvo = "1"
                ), TestLdCertificateDtoOut::class.java
            )

        mockMvc.perform(
            putCertificate(
                createdCertificateOut.id, mapper.writeValueAsString(
                    TestLdCertificateIn(
                        exam = createdCertificateOut.exam,
                        name = createdCertificateOut.name,
                        publishState = PublishState.DELETED,
                        aineKoodiArvo = "1"
                    )
                ), null
            )
        ).andExpect(status().isOk)
            .andReturn().response.contentAsString

        mockMvc.perform(getCertificateById(Exam.LD, createdCertificateOut.id)).andExpect(status().isNotFound())

        val certificates: TestCertificatesOut<TestLdCertificateDtoOut> = mapper.readValue(
            mockMvc.perform(getAllCertificates(Exam.LD)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        )

        val content = certificates.content

        val noneHaveMatchingId = content.none { it.id == createdCertificateOut.id }

        assertTrue(noneHaveMatchingId, "No certificate should have the ID of the deleted one")
    }
}
