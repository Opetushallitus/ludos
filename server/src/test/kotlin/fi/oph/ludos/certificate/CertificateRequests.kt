package fi.oph.ludos.certificate

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
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
import java.nio.file.Files
import java.nio.file.Paths

@AutoConfigureMockMvc
abstract class CertificateRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    fun readAttachmentFixtureFile(attachmentFixtureFileName: String): MockMultipartFile {
        val file = Paths.get("src/main/resources/fixtures/$attachmentFixtureFileName")
        val fileContents = Files.readAllBytes(file)
        return MockMultipartFile("attachment", attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents)
    }

    fun postCertificate(certificate: String, attachmentPart: MockMultipartFile?): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder =
            MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/certificate")
                .part(certificatePart)
        attachmentPart?.let { reqBuilder.file(it) }
        return reqBuilder
    }

    inline fun <reified T : TestCertificateOut> getAllCertificatesContent(res: String): List<T> {
        val typeReference = object : TypeReference<TestCertificatesOut<T>>() {}
        return mapper.readValue(res, typeReference).content
    }

    fun getCertificateById(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id")

    fun putCertificate(
        id: Int,
        certificate: String,
        attachmentPart: MockMultipartFile?
    ): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/certificate/$id")
            .part(certificatePart)
        attachmentPart?.let { reqBuilder.file(it) }
        return reqBuilder
    }

    fun getAttachment(fileKey: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/attachment/$fileKey")

    fun getAllCertificates(exam: Exam) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam").contentType(MediaType.APPLICATION_JSON)
}