package fi.oph.ludos.instruction

import com.fasterxml.jackson.databind.ObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.mock.web.MockPart
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.nio.file.Files
import java.nio.file.Paths

fun getInstructionById(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun getAllInstructions(exam: Exam) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam").contentType(MediaType.APPLICATION_JSON)

fun updateInstruction(id: Int, certificateIn: String, attachmentsMetadata: List<TestInstructionAttachmentMetadata>, objectMapper: ObjectMapper): MockHttpServletRequestBuilder {
    val instructionPart = MockPart("instruction", certificateIn.toByteArray())
    instructionPart.headers.contentType = MediaType.APPLICATION_JSON

    val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/instruction/$id").part(instructionPart)

    attachmentsMetadata.forEach {
        val metadataPart = MockPart(
            "attachments-metadata", objectMapper.writeValueAsString(it).toByteArray()
        )
        metadataPart.headers.contentType = MediaType.APPLICATION_JSON
        reqBuilder.part(metadataPart)
    }

    return reqBuilder
}


fun postInstruction(
    certificate: String, attachmentParts: List<TestInstructionAttachmentData>, objectMapper: ObjectMapper
): MockHttpServletRequestBuilder {
    val instructionPart = MockPart("instruction", certificate.toByteArray())
    instructionPart.headers.contentType = MediaType.APPLICATION_JSON

    val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/instruction").part(instructionPart)
    attachmentParts.forEach {
        val metadataPart = MockPart(
            "attachments-metadata", objectMapper.writeValueAsString(it.instructionAttachmentMetadata).toByteArray()
        )
        metadataPart.headers.contentType = MediaType.APPLICATION_JSON
        reqBuilder.file(it.file)
        reqBuilder.part(metadataPart)
    }

    return reqBuilder
}

fun getInstruction(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun readAttachmentFixtureFile(attachmentFixtureFileName: String, partName: String): MockMultipartFile {
    val file = Paths.get("src/test/resources/fixtures/$attachmentFixtureFileName")
    val fileContents = Files.readAllBytes(file)

    return MockMultipartFile(
        partName, attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents
    )
}

fun uploadInstructionAttachment(
    exam: Exam,
    instructionId: Int,
    instructionAttachmentMetadata: TestInstructionAttachmentMetadata,
    file: MockMultipartFile,
    objectMapper: ObjectMapper
): MockMultipartHttpServletRequestBuilder {
    val reqBuilder = MockMvcRequestBuilders.multipart(
        HttpMethod.POST,
        "${Constants.API_PREFIX}/instruction/attachment/$exam/$instructionId"
    )

    val metadataPart = MockPart(
        "attachment-metadata", objectMapper.writeValueAsString(instructionAttachmentMetadata).toByteArray()
    )
    metadataPart.headers.contentType = MediaType.APPLICATION_JSON
    reqBuilder.file(file)
    reqBuilder.part(metadataPart)

    return reqBuilder
}

fun deleteInstructionAttachment(fileKey: String) =
    MockMvcRequestBuilders.delete("${Constants.API_PREFIX}/instruction/attachment/$fileKey")

fun downloadInstructionAttachment(fileKey: String) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/attachment/$fileKey")
