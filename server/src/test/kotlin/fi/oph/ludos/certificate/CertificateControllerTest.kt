package fi.oph.ludos.certificate

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.kotlinModule
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.WithYllapitajaRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder
import org.springframework.mock.web.MockMultipartFile
import org.springframework.mock.web.MockPart
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Paths
import java.sql.Timestamp
import java.time.ZonedDateTime
import javax.transaction.Transactional

fun postCertificate(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/certificate").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getCertificateById(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id")

fun updateCertificate(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/certificate/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun postAttachment(file: MockMultipartFile, oldFileKey: String?): MockMultipartHttpServletRequestBuilder {
    val baseRequest = MockMvcRequestBuilders.multipart("${Constants.API_PREFIX}/certificate/upload").file(file)

    return if (oldFileKey == null) {
        baseRequest
    } else {
        val part = MockPart("oldFileKey", oldFileKey.toByteArray())
        baseRequest.part(part)
    }
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

    data class TestCertificateIn(
        val exam: Exam,
        val name: String,
        val description: String,
        val publishState: PublishState,
        val fileKey: String,
    )

    data class TestCertificateOut(
        val id: Int,
        val exam: Exam,
        val name: String,
        val description: String,
        val publishState: PublishState,
        val fileName: String,
        val fileKey: String,
        val fileUploadDate: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    data class TestFileUploadOut(
        val fileName: String, val fileKey: String, val fileUploadDate: ZonedDateTime
    )

    val keyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()

    private fun uploadFixtureFile(fileName: String, oldKey: String?): TestFileUploadOut {
        val pdfFile = Paths.get("src/test/resources/fixtures/$fileName")
        val fileContent = Files.readAllBytes(pdfFile)
        val file = MockMultipartFile("file", "fixture2.pdf", MediaType.APPLICATION_PDF_VALUE, fileContent)
        val uploadedFileOutStr =
            mockMvc.perform(postAttachment(file, oldKey)).andExpect(status().isOk).andReturn().response.contentAsString
        val uploadedFileOut = objectMapper.readValue(uploadedFileOutStr, TestFileUploadOut::class.java)

        assertTrue(uploadedFileOut.fileKey.matches(keyRegex), "Invalid fileKey: ${uploadedFileOut.fileKey}")
        assertEquals(uploadedFileOut.fileName, "fixture2.pdf")
        assertEquals(
            uploadedFileOut.fileUploadDate.toString().substring(0, 10), ZonedDateTime.now().toString().substring(0, 10)
        )

        val attachmentPreviewResponse = mockMvc.perform(getAttachmentPreview(uploadedFileOut.fileKey)).andExpect(status().isOk).andReturn().response

        assertArrayEquals(fileContent, attachmentPreviewResponse.contentAsByteArray)
        assertEquals("application/pdf", attachmentPreviewResponse.contentType)
        assertEquals("inline; filename=fixture2.pdf", attachmentPreviewResponse.getHeader("content-disposition"))

//        if (oldKey != null) {
//            mockMvc.perform(getAttachmentPreview(oldKey)).andExpect(status().isInternalServerError)
//        }

        return uploadedFileOut
    }

    private fun createCertificate(): TestCertificateOut {
        val uploadedFileOut = uploadFixtureFile("fixture.pdf", null)

        val certificateIn = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
            fileKey = uploadedFileOut.fileKey,
        )

        val testCertificateStr = objectMapper.writeValueAsString(certificateIn)

        val postResult = mockMvc.perform(postCertificate(testCertificateStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateOut = objectMapper.readValue(postResult, TestCertificateOut::class.java)

        assertEquals(certificateIn.name, certificateOut.name)
        assertEquals(certificateIn.exam, certificateOut.exam)
        assertEquals(certificateIn.description, certificateOut.description)
        assertEquals(certificateIn.publishState, certificateOut.publishState)
        assertEquals(certificateOut.fileKey, uploadedFileOut.fileKey)
        assertNotNull(certificateOut.id)
        assertNotNull(certificateOut.createdAt)
        assertNotNull(certificateOut.updatedAt)

        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, certificateOut.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateByIdOut = objectMapper.readValue(getResult, TestCertificateOut::class.java)

        assertEquals(certificateOut.id, certificateByIdOut.id)
        assertEquals(certificateOut.name, certificateByIdOut.name)
        assertEquals(certificateOut.description, certificateByIdOut.description)
        assertEquals(certificateOut.publishState, certificateByIdOut.publishState)
        assertEquals(certificateOut.fileName, certificateByIdOut.fileName)
        assertEquals(certificateOut.fileKey, certificateByIdOut.fileKey)
        assertEquals(certificateOut.fileUploadDate.substring(0, 10), certificateByIdOut.fileUploadDate.substring(0, 10))
        assertNotNull(certificateByIdOut.createdAt)
        assertNotNull(certificateByIdOut.updatedAt)

        return certificateByIdOut
    }

    @Test
    @WithYllapitajaRole
    fun publishAndUpdateCertificateWithoutUpdatingAttachment() {
        val certificateOut = createCertificate()

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
            fileKey = certificateOut.fileKey
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        mockMvc.perform(updateCertificate(certificateOut.id, editedCertificateStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, certificateOut.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificate = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificate.name)
        assertEquals(editedCertificate.description, updatedCertificate.description)
        assertEquals(PublishState.PUBLISHED, updatedCertificate.publishState)
        assertEquals(certificateOut.fileName, updatedCertificate.fileName)
        assertEquals(certificateOut.fileKey, updatedCertificate.fileKey)
        assertNotNull(updatedCertificate.fileUploadDate)
        assertEquals(certificateOut.id, updatedCertificate.id)
    }

    @Test
    @WithYllapitajaRole
    fun publishAndUpdateCertificateWithUpdatedAttachment() {
        val certificateOut = createCertificate()

        val uploadedFileOut = uploadFixtureFile("fixture2.pdf", certificateOut.fileKey)

        mockMvc.perform(getAttachmentPreview(uploadedFileOut.fileKey))


        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
            fileKey = uploadedFileOut.fileKey
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        mockMvc.perform(updateCertificate(certificateOut.id, editedCertificateStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, certificateOut.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificate = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificate.name)
        assertEquals(editedCertificate.description, updatedCertificate.description)
        assertEquals(PublishState.PUBLISHED, updatedCertificate.publishState)
        assertEquals(certificateOut.fileName, updatedCertificate.fileName)
        assertEquals(uploadedFileOut.fileKey, updatedCertificate.fileKey)
        assertNotNull(updatedCertificate.fileUploadDate)
        assertEquals(certificateOut.id, updatedCertificate.id)
    }

    @Test
    fun putCertificateWithMissingAttachment() {
        val certificateOut = createCertificate()

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = certificateOut.name,
            description = certificateOut.description,
            publishState = certificateOut.publishState,
            fileKey = "does not exist"
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        val result =
            mockMvc.perform(updateCertificate(certificateOut.id, editedCertificateStr)).andExpect(status().isBadRequest)
                .andReturn().response.contentAsString

        assertEquals(
            "Attachment '${editedCertificate.fileKey}' not found for certificate id: ${certificateOut.id}", result
        )
    }

    @Test
    fun putCertificateWithMissingCertificate() {
        val certificateOut = createCertificate()

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = certificateOut.name,
            description = certificateOut.description,
            publishState = certificateOut.publishState,
            fileKey = "does not exist"
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        val result = mockMvc.perform(updateCertificate(-1, editedCertificateStr)).andExpect(status().isNotFound)
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
                "fileName": "test_certificate.pdf",
                "fileKey": "https://amazon_url.com/test_certificate.pdf",
                "fileUploadDate": "2023-06-13"
            }
        """

        mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidPublishState() {
        val body = """
        {
            "name": "Test Certificate",
            "description": "Certificate content",
            "publishState": "",
            "exam": "SUKO",
            "fileName": "test_certificate.pdf",
            "fileKey": "https://amazon_url.com/test_certificate.pdf",
            "fileUploadDate": "2023-06-13"
        }
        """

        val postResult = mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Invalid JSON payload: JSON parse error")
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() {
        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "Certificate not found 999")
    }
}
