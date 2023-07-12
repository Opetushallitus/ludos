package fi.oph.ludos.certificate

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.kotlinModule
import fi.oph.ludos.*
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.mock.web.MockMultipartFile
import org.springframework.mock.web.MockPart
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Paths
import java.sql.Timestamp
import javax.transaction.Transactional

data class TestCertificateIn(
    val exam: Exam,
    val name: String,
    val description: String,
    val publishState: PublishState,
)

data class TestCertificateAttachmentOut(
    val fileKey: String,
    val fileName: String,
    val fileUploadDate: String,
)

data class TestCertificateOut(
    val id: Int,
    val exam: Exam,
    val name: String,
    val description: String,
    val publishState: PublishState,
    val attachment: TestCertificateAttachmentOut,
    val authorOid: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

fun readAttachmentFixtureFile(attachmentFixtureFileName: String): MockMultipartFile {
    val file = Paths.get("src/test/resources/fixtures/$attachmentFixtureFileName")
    val fileContents = Files.readAllBytes(file)
    return MockMultipartFile("attachment", attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents)
}

fun postCertificate(certificate: String, attachmentPart: MockMultipartFile?): MockHttpServletRequestBuilder {
    val certificatePart = MockPart("certificate", certificate.toByteArray())
    certificatePart.headers.contentType = MediaType.APPLICATION_JSON

    val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/certificate").part(certificatePart)
    attachmentPart?.let { reqBuilder.file(it) }
    return reqBuilder
}


fun getCertificateById(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id")

fun putCertificate(id: Int, certificate: String, attachmentPart: MockMultipartFile?): MockHttpServletRequestBuilder {
    val certificatePart = MockPart("certificate", certificate.toByteArray())
    certificatePart.headers.contentType = MediaType.APPLICATION_JSON

    val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/certificate/$id")
        .part(certificatePart)
    attachmentPart?.let { reqBuilder.file(it) }
    return reqBuilder
}

fun getAttachmentPreview(fileKey: String) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/preview/$fileKey")

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CertificateControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper: ObjectMapper =
        Jackson2ObjectMapperBuilder.json().modules(JavaTimeModule(), kotlinModule()).build()


    val fileKeyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()
    private fun validateFileKey(fileKey: String) = assertTrue(fileKey.matches(fileKeyRegex), "Invalid fileKey: $fileKey")

    private fun assertPreviewReturnsExpectedAttachment(fileKey: String, expectedFileName: String, expectedFileContent: ByteArray) {
        val attachmentPreviewResponse =
            mockMvc.perform(getAttachmentPreview(fileKey)).andExpect(status().isOk).andReturn().response

        assertArrayEquals(expectedFileContent, attachmentPreviewResponse.contentAsByteArray)
        assertEquals("application/pdf", attachmentPreviewResponse.contentType)
        assertEquals("inline; filename=\"${expectedFileName}\"", attachmentPreviewResponse.getHeader("content-disposition"))
    }

    private fun createCertificateAndCheckIt(publishState: PublishState): TestCertificateOut {
        val certificateToCreate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = publishState,
        )
        val attachmentFileName = "fixture.pdf"

        val certificateToCreateStr = objectMapper.writeValueAsString(certificateToCreate)

        val attachmentPart = readAttachmentFixtureFile(attachmentFileName)
        val createdCertificateStr = mockMvc.perform(postCertificate(certificateToCreateStr, attachmentPart)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val createdCertificate = objectMapper.readValue(createdCertificateStr, TestCertificateOut::class.java)

        assertNotNull(createdCertificate.id)
        assertEquals(certificateToCreate.name, createdCertificate.name)
        assertEquals(certificateToCreate.exam, createdCertificate.exam)
        assertEquals(certificateToCreate.description, createdCertificate.description)
        assertEquals(certificateToCreate.publishState, createdCertificate.publishState)
        assertEquals(createdCertificate.attachment.fileName, attachmentFileName)
        validateFileKey(createdCertificate.attachment.fileKey)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, createdCertificate.authorOid)
        assertNotNull(createdCertificate.attachment.fileUploadDate)
        assertNotNull(createdCertificate.createdAt)
        assertNotNull(createdCertificate.updatedAt)

        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateById = objectMapper.readValue(getResult, TestCertificateOut::class.java)

        assertEquals(createdCertificate.id, certificateById.id)
        assertEquals(certificateToCreate.name, certificateById.name)
        assertEquals(certificateToCreate.description, certificateById.description)
        assertEquals(certificateToCreate.publishState, certificateById.publishState)
        assertEquals(createdCertificate.attachment, certificateById.attachment)
        assertEquals(createdCertificate.authorOid, certificateById.authorOid)
        assertNotNull(certificateById.createdAt)
        assertNotNull(certificateById.updatedAt)

        assertPreviewReturnsExpectedAttachment(certificateById.attachment.fileKey, attachmentFileName, attachmentPart.bytes)

        return certificateById
    }

    @Test
    @WithYllapitajaRole
    fun publishCertificate() {
        createCertificateAndCheckIt(PublishState.PUBLISHED)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificateAndPublishCertificateWithoutUpdatingAttachment() {
        val createdCertificate = createCertificateAndCheckIt(PublishState.DRAFT)

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, null)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificateById = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificateById.name)
        assertEquals(editedCertificate.description, updatedCertificateById.description)
        assertEquals(PublishState.PUBLISHED, updatedCertificateById.publishState)
        assertEquals(createdCertificate.attachment, updatedCertificateById.attachment)
        assertEquals(createdCertificate.id, updatedCertificateById.id)
        assertEquals(createdCertificate.authorOid, updatedCertificateById.authorOid)
        assertNotEquals(createdCertificate.updatedAt, updatedCertificateById.updatedAt)
    }

    @Test
    @WithYllapitajaRole
    fun publishAndUpdateCertificateWithUpdatedAttachment() {
        val createdCertificate = createCertificateAndCheckIt(PublishState.PUBLISHED)

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachmentFixtureFileName = "fixture2.pdf"
        val newAttachment = readAttachmentFixtureFile(newAttachmentFixtureFileName)
        mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, newAttachment)).andExpect(status().isOk)
            .andReturn()

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificateById = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificateById.name)
        assertEquals(editedCertificate.description, updatedCertificateById.description)
        assertEquals(editedCertificate.publishState, updatedCertificateById.publishState)
        assertEquals(newAttachmentFixtureFileName, updatedCertificateById.attachment.fileName)
        validateFileKey(updatedCertificateById.attachment.fileKey)
        assertNotEquals(updatedCertificateById.attachment.fileKey, createdCertificate.attachment.fileKey)
        assertNotNull(updatedCertificateById.attachment.fileUploadDate)
        assertNotEquals(updatedCertificateById.attachment.fileUploadDate, createdCertificate.attachment.fileUploadDate)
        assertEquals(createdCertificate.authorOid, updatedCertificateById.authorOid)
        assertEquals(createdCertificate.id, updatedCertificateById.id)

        assertPreviewReturnsExpectedAttachment(updatedCertificateById.attachment.fileKey, newAttachmentFixtureFileName, newAttachment.bytes)

        mockMvc.perform(getAttachmentPreview(createdCertificate.attachment.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificate() {
        createCertificateAndCheckIt(PublishState.DRAFT)
    }

    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() {
        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Name",
            description = "Description",
            publishState = PublishState.PUBLISHED,
        )
        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

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
                "exam": "WRONG",
            }
        """

        val attachmentPart = readAttachmentFixtureFile("fixture.pdf")
        val postResponseBody = mockMvc.perform(postCertificate(body, attachmentPart)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(postResponseBody, CoreMatchers.containsString("String \"WRONG\": not one of the values accepted for Enum class: [LD, SUKO, PUHVI]"))
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithMissingAttachment() {
        val certificateIn = TestCertificateIn(
            exam = Exam.LD,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
        )
        val certificateInStr  = objectMapper.writeValueAsString(certificateIn)

        val postResponseBody = mockMvc.perform(postCertificate(certificateInStr, null)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(postResponseBody, emptyString())
    }

    @Test
    @WithYllapitajaRole
    fun putCertificateWithInvalidPublishState() {
        val createdCertificateOut = createCertificateAndCheckIt(PublishState.PUBLISHED)

        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "NON_EXISTENT_PUBLISH_STATE",
                "exam": "PUHVI",
            }
        """

        val putResponseBody = mockMvc.perform(putCertificate(createdCertificateOut.id, body, null)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(putResponseBody, CoreMatchers.containsString("String \"NON_EXISTENT_PUBLISH_STATE\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED]"))
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() {
        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "Certificate not found 999")
    }
}
