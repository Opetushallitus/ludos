package fi.oph.ludos.instruction

import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import fi.oph.ludos.aws.Bucket
import fi.oph.ludos.aws.S3Helper
import jakarta.servlet.ServletRequest
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
    val auditLogger: Logger = LoggerFactory.getLogger(AUDIT_LOGGER_NAME)

    fun createInstruction(
        instruction: Instruction,
        attachments: List<InstructionAttachmentIn>,
        request: ServletRequest
    ): InstructionOut {
        val createdInstruction = repository.createInstruction(instruction, attachments)

        auditLogger.atInfo().addLudosUserInfo().addUserIp(request)
            .addKeyValue("instruction", createdInstruction)
            .log("Created instruction")

        return createdInstruction
    }

    fun createNewVersionOfInstruction(
        id: Int,
        instruction: InstructionIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>,
        request: ServletRequest
    ): Int? {
        val createdVersion = when (instruction) {
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
        }
        if (createdVersion != null) {
            val createdInstruction = repository.getInstructionById(Exam.SUKO, id, createdVersion)
            auditLogger.atInfo().addUserIp(request).addLudosUserInfo()
                .addKeyValue("instruction", createdInstruction)
                .log("Created new version of instruction")
        } else {
            auditLogger.atError().addUserIp(request).addLudosUserInfo()
                .addKeyValue("instructionId", id)
                .log("Tried to create new version of non-existent instruction")
        }

        return createdVersion
    }

    fun restoreOldVersionOfInstruction(
        exam: Exam,
        id: Int,
        version: Int,
        request: ServletRequest
    ): Int? {
        val instructionToRestore = repository.getInstructionById(exam, id, version) ?: return null

        val latestVersion = repository.getInstructionById(exam, id, null)!!
        if (version == latestVersion.version) {
            auditLogger.atWarn().addUserIp(request).addLudosUserInfo()
                .addKeyValue(
                    "restoreVersionInfo",
                    RestoreVersionInfoForLogging(exam, id, version, null)
                )
                .log("Tried to restore latest version of instruction")
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot restore latest version")
        }

        val attachmentMetadatas = instructionToRestore.attachments.map { InstructionAttachmentMetadataDtoIn(it) }
        val createdVersion = when (instructionToRestore) {
            is SukoInstructionDtoOut ->
                repository.createNewVersionOfSukoInstruction(
                    id,
                    SukoInstructionDtoIn(instructionToRestore),
                    attachmentMetadatas,
                    emptyList()
                )

            is LdInstructionDtoOut ->
                repository.createNewVersionOfLdInstruction(
                    id,
                    LdInstructionDtoIn(instructionToRestore),
                    attachmentMetadatas,
                    emptyList()
                )

            is PuhviInstructionDtoOut ->
                repository.createNewVersionOfPuhviInstruction(
                    id,
                    PuhviInstructionDtoIn(instructionToRestore),
                    attachmentMetadatas,
                    emptyList()
                )
        }

        auditLogger.atInfo().addUserIp(request).addLudosUserInfo()
            .addKeyValue(
                "restoreVersionInfo",
                RestoreVersionInfoForLogging(exam, id, version, createdVersion!!)
            ).log("Restored old version of instruction")

        return createdVersion
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

    fun addUpdaterNames(instructions: List<InstructionOut>): List<InstructionOut> {
        val uniqueOids = instructions.map { it.updaterOid }.toSet()
        val oidToName = uniqueOids.associateWith { oppijanumerorekisteriClient.getUserDetailsByOid(it) }
        return instructions.map {
            val updaterName = oidToName.getOrDefault(it.updaterOid, null)?.formatName()
            when (it) {
                is SukoInstructionDtoOut -> it.copy(updaterName = updaterName)
                is LdInstructionDtoOut -> it.copy(updaterName = updaterName)
                is PuhviInstructionDtoOut -> it.copy(updaterName = updaterName)
            }
        }
    }

    fun getAttachment(exam: Exam, key: String, version: Int? = null): Pair<InstructionAttachmentDtoOut, InputStream> {
        val fileUpload = repository.getAttachmentByFileKey(exam, key, version) ?: throw ResponseStatusException(
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