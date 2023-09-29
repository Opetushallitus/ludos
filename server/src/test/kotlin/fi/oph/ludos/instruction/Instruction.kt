package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import org.springframework.mock.web.MockMultipartFile

data class TestInstructionIn(
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    val publishState: String,
    val exam: String
)

data class TestInstructionOut(
    val id: Int,
    val exam: Exam,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    val publishState: String,
    val authorOid: String,
    val createdAt: String,
    val updatedAt: String,
    val attachments: List<TestAttachmentOut>
)

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
