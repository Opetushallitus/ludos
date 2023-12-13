package fi.oph.ludos.instruction

import com.fasterxml.jackson.databind.ObjectMapper
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
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths

@AutoConfigureMockMvc
abstract class InstructionRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    protected fun assertInstructionDataClass(
        updatedInstructionDtoIn: TestInstruction,
        res: String
    ) = when (updatedInstructionDtoIn) {
        is TestSukoInstructionDtoIn -> mapper.readValue(res, SukoInstructionDtoOut::class.java)
        is TestLdInstructionDtoIn -> mapper.readValue(res, LdInstructionDtoOut::class.java)
        is TestPuhviInstructionDtoIn -> mapper.readValue(res, PuhviInstructionDtoOut::class.java)
        else -> throw Exception("Unknown instruction type")
    }

    fun getInstructionById(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id")
            .contentType(MediaType.APPLICATION_JSON)

    fun performGetInstructionById(exam: Exam, id: Int): InstructionOut {
        val createdInstructionByIdStr =
            mockMvc.perform(getInstructionById(exam, id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val dtoClass = when (exam) {
            Exam.SUKO -> SukoInstructionDtoOut::class.java
            Exam.LD -> LdInstructionDtoOut::class.java
            Exam.PUHVI -> PuhviInstructionDtoOut::class.java
        }

        return mapper.readValue(createdInstructionByIdStr, dtoClass)
    }

    fun getAllInstructionsReq(
        exam: Exam,
        filters: InstructionBaseFilters? = null,
        user: RequestPostProcessor? = null
    ): MockHttpServletRequestBuilder {
        val builder = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam")

        if (filters != null) {
            filters.jarjesta?.let { builder.queryParam("jarjesta", it) }

            when (filters) {
                is LdInstructionFilters -> filters.aine?.let { builder.queryParam("aine", it) }
                is PuhviInstructionFilters -> Unit
                is SukoInstructionFilters -> Unit
            }
        }

        if (user != null) {
            builder.with(user)
        }

        return builder.contentType(MediaType.APPLICATION_JSON)
    }

    inline fun <reified F : InstructionBaseFilters, reified I : InstructionOut, reified O : InstructionFilterOptions> getAllInstructions(
        exam: Exam,
        filters: F? = null,
        user: RequestPostProcessor? = null
    ): InstructionListDtoOut<I, O> {
        val res = mockMvc.perform(getAllInstructionsReq(exam, filters, user))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        return mapper.readValue<InstructionListDtoOut<I, O>>(res)
    }

    fun updateInstruction(
        id: Int,
        certificateIn: String,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        objectMapper: ObjectMapper
    ): MockHttpServletRequestBuilder {
        val instructionPart = MockPart("instruction", certificateIn.toByteArray())
        instructionPart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/instruction/$id")
            .part(instructionPart)

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
        certificate: String, attachmentParts: List<InstructionAttachmentIn>, objectMapper: ObjectMapper
    ): MockHttpServletRequestBuilder {
        val instructionPart = MockPart("instruction", certificate.toByteArray())
        instructionPart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/instruction")
            .part(instructionPart)
        attachmentParts.forEach {
            val metadataPart = MockPart(
                "attachments-metadata", objectMapper.writeValueAsString(it.metadata).toByteArray()
            )
            metadataPart.headers.contentType = MediaType.APPLICATION_JSON
            reqBuilder.file(mockMultipartFile(it.file))
            reqBuilder.part(metadataPart)
        }

        return reqBuilder
    }

    fun getInstruction(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id")
            .contentType(MediaType.APPLICATION_JSON)

    fun readAttachmentFixtureFile(attachmentFixtureFileName: String, partName: String): MockMultipartFile {
        val file = Paths.get("src/main/resources/fixtures/$attachmentFixtureFileName")
        val fileContents = Files.readAllBytes(file)

        return MockMultipartFile(
            partName, attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents
        )
    }

    fun uploadInstructionAttachment(
        exam: Exam,
        instructionId: Int,
        instructionAttachmentMetadata: InstructionAttachmentMetadataDtoIn,
        file: MultipartFile,
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
        reqBuilder.file(mockMultipartFile(file))
        reqBuilder.part(metadataPart)

        return reqBuilder
    }

    fun deleteInstructionAttachment(fileKey: String) =
        MockMvcRequestBuilders.delete("${Constants.API_PREFIX}/instruction/attachment/$fileKey")

    fun downloadInstructionAttachment(fileKey: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/attachment/$fileKey")

    private fun mockMultipartFile(file: MultipartFile): MockMultipartFile =
        when (file) {
            is MockMultipartFile -> file
            else -> MockMultipartFile(file.name, file.originalFilename, file.contentType, file.inputStream)
        }
}