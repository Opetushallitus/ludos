package fi.oph.ludos.instruction

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.yllapitajaUser
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
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import kotlin.reflect.KClass

@AutoConfigureMockMvc
abstract class InstructionRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    val minimalSukoInstructionIn = TestSukoInstructionDtoIn(
        nameFi = "nameFi",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        shortDescriptionFi = "",
        shortDescriptionSv = "",
        publishState = PublishState.PUBLISHED,
        exam = Exam.SUKO,
    )

    val minimalLdInstructionIn = TestLdInstructionDtoIn(
        nameFi = "nameFi",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        publishState = PublishState.PUBLISHED,
        aineKoodiArvo = "1",
        exam = Exam.LD,
    )

    val minimalPuhviInstructionIn = TestPuhviInstructionDtoIn(
        nameFi = "nameFi",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        shortDescriptionFi = "",
        shortDescriptionSv = "",
        publishState = PublishState.PUBLISHED,
        exam = Exam.PUHVI,
    )

    fun minimalInstructionIn(exam: Exam) = when (exam) {
        Exam.SUKO -> minimalSukoInstructionIn
        Exam.LD -> minimalLdInstructionIn
        Exam.PUHVI -> minimalPuhviInstructionIn
    }

    fun examByTestInstructionOutClass(testInstructionOutClass: KClass<out InstructionOut>): Exam =
        when (testInstructionOutClass) {
            SukoInstructionDtoOut::class -> Exam.SUKO
            LdInstructionDtoOut::class -> Exam.LD
            PuhviInstructionDtoOut::class -> Exam.PUHVI
            else -> throw RuntimeException("unsupported InstructionOutClass '$testInstructionOutClass'")
        }

    fun getInstructionByIdReq(exam: Exam, id: Int, version: Int? = null): MockHttpServletRequestBuilder {
        val url = "${Constants.API_PREFIX}/instruction/$exam/$id" + if (version != null) "/$version" else ""
        return MockMvcRequestBuilders.get(url).contentType(MediaType.APPLICATION_JSON)
    }

    inline fun <reified T : InstructionOut> getInstructionById(id: Int, version: Int? = null): T {
        val exam = examByTestInstructionOutClass(T::class)

        val createdInstructionByIdStr =
            mockMvc.perform(getInstructionByIdReq(exam, id, version)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        return mapper.readValue(createdInstructionByIdStr)
    }

    fun getInstructionByIdByExam(
        exam: Exam,
        id: Int,
        version: Int? = null
    ): InstructionOut = when (exam) {
        Exam.SUKO -> getInstructionById<SukoInstructionDtoOut>(id, version)
        Exam.LD -> getInstructionById<LdInstructionDtoOut>(id, version)
        Exam.PUHVI -> getInstructionById<PuhviInstructionDtoOut>(id, version)
    }

    fun getAllInstructionVersionsReq(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id/versions")
            .contentType(MediaType.APPLICATION_JSON)

    inline fun <reified T : InstructionOut> getAllInstructionVersions(id: Int): List<T> {
        val exam = examByTestInstructionOutClass(T::class)

        val responseContent =
            mockMvc.perform(getAllInstructionVersionsReq(exam, id)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        return mapper.readValue<List<T>>(responseContent)
    }

    fun getAllInstructionVersionsByExam(exam: Exam, id: Int) = when (exam) {
        Exam.SUKO -> getAllInstructionVersions<SukoInstructionDtoOut>(id)
        Exam.LD -> getAllInstructionVersions<LdInstructionDtoOut>(id)
        Exam.PUHVI -> getAllInstructionVersions<PuhviInstructionDtoOut>(id)
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
        filters: F? = null,
        user: RequestPostProcessor? = null
    ): InstructionListDtoOut<I, O> {
        val exam = examByTestInstructionOutClass(I::class)
        val res = mockMvc.perform(getAllInstructionsReq(exam, filters, user))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        return mapper.readValue<InstructionListDtoOut<I, O>>(res)
    }

    fun getAllInstructionsByExam(exam: Exam): InstructionListDtoOut<out InstructionOut, out InstructionFilterOptions> =
        when (exam) {
            Exam.SUKO -> getAllInstructions<SukoInstructionFilters, SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>()
            Exam.LD -> getAllInstructions<LdInstructionFilters, LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>()
            Exam.PUHVI -> getAllInstructions<PuhviInstructionFilters, PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>()
        }

    fun createNewVersionOfInstructionReq(
        id: Int,
        instructionIn: String,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn> = emptyList(),
        newAttachments: List<InstructionAttachmentIn> = emptyList()
    ): MockHttpServletRequestBuilder {
        val instructionPart = MockPart("instruction", instructionIn.toByteArray())
        instructionPart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/instruction/$id")
            .part(instructionPart)

        // Lisää nykyiset liitteet ja niiden metadata
        attachmentsMetadata.forEach {
            val metadataPart = MockPart("attachments-metadata", mapper.writeValueAsString(it).toByteArray())
            metadataPart.headers.contentType = MediaType.APPLICATION_JSON
            reqBuilder.part(metadataPart)
        }
        // Lisää uudet liitteet ja niiden metadata
        newAttachments.forEach {
            val metadataPart = MockPart(
                "new-attachments-metadata", mapper.writeValueAsString(it.metadata).toByteArray()
            )
            metadataPart.headers.contentType = MediaType.APPLICATION_JSON
            reqBuilder.file(mockMultipartFile(it.file))
            reqBuilder.part(metadataPart)
        }

        return reqBuilder
    }

    fun createNewVersionOfInstruction(
        instructionId: Int,
        updatedInstructionIn: TestInstruction,
        updatedInstructionAttachmentsMetadata: List<InstructionAttachmentMetadataDtoIn> = emptyList(),
        newAttachments: List<InstructionAttachmentIn> = emptyList(),
        updaterUser: RequestPostProcessor = yllapitajaUser
    ): Int = mockMvc.perform(
        createNewVersionOfInstructionReq(
            instructionId,
            mapper.writeValueAsString(updatedInstructionIn),
            updatedInstructionAttachmentsMetadata,
            newAttachments
        ).with(updaterUser)
    ).andExpect(status().isOk).andReturn().response.contentAsString.toInt()


    fun createInstructionReq(
        certificate: String, attachmentParts: List<InstructionAttachmentIn>
    ): MockHttpServletRequestBuilder {
        val instructionPart = MockPart("instruction", certificate.toByteArray())
        instructionPart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/instruction")
            .part(instructionPart)
        attachmentParts.forEach {
            val metadataPart = MockPart(
                "attachments-metadata", mapper.writeValueAsString(it.metadata).toByteArray()
            )
            metadataPart.headers.contentType = MediaType.APPLICATION_JSON
            reqBuilder.file(mockMultipartFile(it.file))
            reqBuilder.part(metadataPart)
        }

        return reqBuilder
    }

    inline fun <reified T : InstructionOut> createInstruction(
        certificateIn: String,
        attachmentParts: List<InstructionAttachmentIn> = emptyList(),
        user: RequestPostProcessor = yllapitajaUser
    ): T {
        val responseBody =
            mockMvc.perform(createInstructionReq(certificateIn, attachmentParts).with(user))
                .andExpect(status().isOk).andReturn().response.contentAsString

        return mapper.readValue(responseBody)
    }

    fun restoreInstructionReq(
        exam: Exam,
        id: Int,
        version: Int
    ): MockHttpServletRequestBuilder {
        val url = "${Constants.API_PREFIX}/instruction/$exam/$id/$version/restore"
        return MockMvcRequestBuilders.post(url)
    }

    fun readAttachmentFixtureFile(attachmentFixtureFileName: String, partName: String): MockMultipartFile {
        val file = Paths.get("src/main/resources/fixtures/$attachmentFixtureFileName")
        val fileContents = Files.readAllBytes(file)

        return MockMultipartFile(
            partName, attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents
        )
    }

    fun downloadInstructionAttachment(exam: Exam, fileKey: String, version: Int?) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/attachment/$fileKey" + if (version != null) "/$version" else "")

    private fun mockMultipartFile(file: MultipartFile): MockMultipartFile =
        when (file) {
            is MockMultipartFile -> file
            else -> MockMultipartFile(file.name, file.originalFilename, file.contentType, file.inputStream)
        }
}