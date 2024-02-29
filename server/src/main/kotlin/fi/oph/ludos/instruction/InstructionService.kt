package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import fi.oph.ludos.aws.Bucket
import fi.oph.ludos.aws.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.io.InputStream

@Service
class InstructionService(
    val repository: InstructionRepository,
    val s3Helper: S3Helper,
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun createInstruction(instruction: Instruction, attachments: List<InstructionAttachmentIn>) =
        repository.createInstruction(instruction, attachments)

    fun createNewVersionOfInstruction(
        id: Int,
        instruction: Instruction,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>
    ): Int? = when (instruction) {
        is SukoInstructionDtoIn -> repository.createNewVersionOfSukoInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        )

        is LdInstructionDtoIn -> repository.createNewVersionOfLdInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        )

        is PuhviInstructionDtoIn -> repository.createNewVersionOfPuhviInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        )

        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid instruction type")
    }

    fun getInstructions(
        exam: Exam,
        filters: InstructionBaseFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> =
        repository.getInstructions(exam, filters)

    fun getInstructionById(exam: Exam, id: Int, version: Int? = null): InstructionOut? =
        repository.getInstructionById(exam, id, version)

    fun getAllVersionsOfInstruction(exam: Exam, id: Int): List<InstructionOut> =
        addUpdaterNames(repository.getAllVersionsOfInstruction(id, exam))

    fun addUpdaterNames(assignments: List<InstructionOut>): List<InstructionOut> {
        val uniqueOids = assignments.map { it.updaterOid }.toSet()
        val oidToName = uniqueOids.associateWith { oppijanumerorekisteriClient.getUserDetailsByOid(it) }
        return assignments.map {
            val updaterName = oidToName.getOrDefault(it.updaterOid, null)?.formatName()
            when (it) {
                is SukoInstructionDtoOut -> it.copy(updaterName = updaterName)
                is LdInstructionDtoOut -> it.copy(updaterName = updaterName)
                is PuhviInstructionDtoOut -> it.copy(updaterName = updaterName)
                else -> throw RuntimeException("unreachable")
            }
        }
    }

    fun getAttachment(key: String, version: Int? = null): Pair<InstructionAttachmentDtoOut, InputStream> {
        val fileUpload = repository.getAttachmentByFileKey(key, version) ?: throw ResponseStatusException(
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