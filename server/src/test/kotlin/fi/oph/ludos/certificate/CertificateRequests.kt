package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.mock.web.MockPart
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import java.nio.file.Files
import java.nio.file.Paths

@AutoConfigureMockMvc
abstract class CertificateRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    fun readAttachmentFixtureFile(
        attachmentFixtureFileName: String,
        partName: String = "attachmentFi"
    ): MockMultipartFile {
        val file = Paths.get("src/main/resources/fixtures/$attachmentFixtureFileName")
        val fileContents = Files.readAllBytes(file)
        return MockMultipartFile(partName, attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents)
    }

    fun postCertificate(
        certificate: String,
        attachmentName: String?,
        attachmentNameSv: String? = null
    ): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        val attachmentPartFi = attachmentName?.let { readAttachmentFixtureFile(it) }

        val attachmentPartSv = if (attachmentNameSv != null) {
            readAttachmentFixtureFile(attachmentNameSv, "attachmentSv")
        } else {
            attachmentName?.let { readAttachmentFixtureFile(it) }
        }

        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder =
            MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/certificate")
                .part(certificatePart)
        attachmentPartFi?.let { reqBuilder.file(it) }
        attachmentPartSv?.let { reqBuilder.file(it) }
        return reqBuilder
    }

    inline fun <reified T : CertificateOut> getAllCertificatesContent(res: String): List<T> {
        val content = mapper.readValue<TestCertificatesOut<T>>(res)

        return content.content
    }

    fun getCertificateById(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id")

    fun putCertificate(
        id: Int,
        certificate: String,
        attachmentPart: MockMultipartFile? = null,
        attachmentPartSv: MockMultipartFile? = null
    ): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/certificate/$id")
            .part(certificatePart)
        attachmentPart?.let { reqBuilder.file(it) }
        attachmentPartSv?.let { reqBuilder.file(it) }

        return reqBuilder
    }

    fun getAttachment(fileKey: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/attachment/$fileKey")

    private fun getAllCertificatesReq(
        exam: Exam,
        filters: CertificateFilters? = null,
        user: RequestPostProcessor? = null
    ): MockHttpServletRequestBuilder {
        val builder = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam")

        if (filters != null) {
            filters.jarjesta?.let { builder.queryParam("jarjesta", it) }
        }

        if (user != null) {
            builder.with(user)
        }

        return builder.contentType(MediaType.APPLICATION_JSON)
    }

    fun getAllCertificates(
        exam: Exam,
        filters: CertificateFilters? = null,
        user: RequestPostProcessor? = null
    ): List<CertificateOut> {
        val res = mockMvc.perform(getAllCertificatesReq(exam, filters, user))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andReturn().response.contentAsString

        return getAllCertificatesContent<CertificateOut>(res)
    }
}