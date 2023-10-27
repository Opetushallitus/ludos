package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import org.springframework.mock.web.MockMultipartFile

interface TestInstruction {
    val exam: String
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val publishState: String
}

data class TestSukoOrPuhviInstructionDtoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String
) : TestInstruction

data class TestLdInstructionDtoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: String,
    val aineKoodiArvo: String
) : TestInstruction

interface TestInstructionOut {
    val id: Int
    val exam: Exam
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val publishState: String
    val authorOid: String
    val createdAt: String
    val updatedAt: String
    val attachments: List<TestAttachmentOut>
}

data class TestSukoOrPuhviInstructionDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    override val authorOid: String,
    override val createdAt: String,
    override val updatedAt: String,
    override val attachments: List<TestAttachmentOut>
) : TestInstructionOut

data class TestLdInstructionDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: String,
    val aineKoodiArvo: String,
    override val authorOid: String,
    override val createdAt: String,
    override val updatedAt: String,
    override val attachments: List<TestAttachmentOut>
) : TestInstructionOut

data class TestAttachmentOut(
    val fileKey: String, val fileName: String, val fileUploadDate: String, val name: String, val language: String
)

data class TestInstructionAttachmentMetadata(
    val fileKey: String?,
    val name: String,
    val language: String
)

data class TestInstructionAttachmentData(
    val file: MockMultipartFile, val instructionAttachmentMetadata: TestInstructionAttachmentMetadata
)

data class TestInstructionFilterOptionsDtoOut(
    val aine: List<String>? = null
)

data class TestInstructionsOut<T>(
    val content: List<T>,
    val instructionFilterOptions: TestInstructionFilterOptionsDtoOut
)
