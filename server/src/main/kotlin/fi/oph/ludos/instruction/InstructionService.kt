package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.io.InputStream

@Service
class InstructionService(val repository: InstructionRepository, val s3Helper: S3Helper) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun createInstruction(instruction: Instruction, attachments: List<InstructionAttachmentIn>) =
        repository.createInstruction(instruction, attachments)

    fun updateInstruction(
        id: Int, instruction: Instruction, attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ): Int? = when (instruction) {
        is SukoInstructionDtoIn -> repository.updateSukoInstruction(id, instruction, attachmentsMetadata)
        is LdInstructionDtoIn -> repository.updateLdInstruction(id, instruction, attachmentsMetadata)
        is PuhviInstructionDtoIn -> repository.updatePuhviInstruction(id, instruction, attachmentsMetadata)
        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid instruction type")
    }

    fun getInstructions(
        exam: Exam,
        filters: InstructionBaseFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> =
        repository.getInstructions(exam, filters)

    fun getInstructionById(exam: Exam, id: Int): InstructionOut? = repository.getInstructionById(exam, id)

    fun uploadAttachmentToInstruction(
        exam: Exam,
        instructionId: Int,
        metadata: InstructionAttachmentMetadataDtoIn,
        file: MultipartFile
    ) = repository.uploadAttachmentToInstruction(exam, instructionId, metadata, file)

    fun deleteAttachmentFromInstruction(fileKey: String) = repository.deleteAttachment(fileKey)

    fun getAttachment(key: String): Pair<InstructionAttachmentDtoOut, InputStream> {
        val fileUpload = repository.getAttachmentByFileKey(key) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND, "Certificate attachment '${key}' not found in db"
        )

        val responseInputStream = try {
            s3Helper.getObject(Bucket.INSTRUCTION, key)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to get attachment '${key}' from S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction attachment '${key}' not found in S3")

        return Pair(fileUpload, responseInputStream)
    }
}