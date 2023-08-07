package fi.oph.ludos.instruction

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import javax.servlet.http.Part
import javax.validation.Valid

@RestController
@RequestMapping("${Constants.API_PREFIX}/instruction")
@RequireAtLeastYllapitajaRole
class InstructionController(val service: InstructionService, private val objectMapper: ObjectMapper) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createInstruction(
        @Valid @RequestPart("instruction") instruction: Instruction,
        @RequestPart("attachments", required = false) attachments: List<MultipartFile>?,
        @RequestPart("attachments-metadata", required = false) attachmentsMetadata: List<Part>?
    ): InstructionOut? {
        val nonNullAttachments = attachments ?: emptyList()
        val nonNullAttachmentsMetadata = attachmentsMetadata ?: emptyList()

        if (nonNullAttachments.size != nonNullAttachmentsMetadata.size) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Got ${nonNullAttachments.size} attachments, but ${nonNullAttachmentsMetadata.size} metadata"
            )
        }


        val attachmentMetadataDeserialized: List<InstructionAttachmentMetadataDtoIn> =
            nonNullAttachmentsMetadata.map { objectMapper.readValue(it.inputStream) }

        val attachmentIns = nonNullAttachments.indices.map {
            InstructionAttachmentIn(
                nonNullAttachments[it], attachmentMetadataDeserialized[it]
            )
        }


        return service.createInstruction(instruction, attachmentIns)
    }

    @GetMapping("/{exam}")
    @RequireAtLeastOpettajaRole
    fun getInstructions(
        @PathVariable exam: Exam
    ): List<InstructionOut> = service.getInstructions(exam)

    @GetMapping("/{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): InstructionOut {
        val instructionDtoOut = service.getInstructionById(exam, id)

        return instructionDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction not found $id")
    }

    @PostMapping("/attachment/{exam}/{instructionId}")
    @RequireAtLeastYllapitajaRole
    fun uploadAttachment(
        @PathVariable exam: Exam,
        @PathVariable("instructionId") instructionId: Int,
        @RequestPart("file") file: MultipartFile,
        @RequestPart("attachment-metadata") attachmentMetadata: Part
    ): InstructionAttachmentDtoOut {
        val attachmentMetadataDeserialized: InstructionAttachmentMetadataDtoIn =
            objectMapper.readValue(attachmentMetadata.inputStream)

        if (file.originalFilename == "this-will-fail.txt") {
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed successfully :)")
        }

        return service.uploadAttachmentToInstruction(
            exam, instructionId, attachmentMetadataDeserialized, file
        )
    }

    @DeleteMapping("/attachment/{fileKey}")
    @RequireAtLeastYllapitajaRole
    fun deleteAttachment(
        @PathVariable("fileKey") fileKey: String
    ) = service.deleteAttachmentFromInstruction(fileKey)

    @PutMapping("/{id}")
    @RequireAtLeastYllapitajaRole
    fun updateInstruction(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("instruction") instruction: Instruction,
        @RequestPart("attachments-metadata", required = false) attachmentsMetadata: List<Part>?
    ) {
        val attachmentsMetadataDeserialized: List<InstructionAttachmentMetadataDtoIn> =
            attachmentsMetadata?.map { objectMapper.readValue(it.inputStream) } ?: emptyList()

        attachmentsMetadataDeserialized.forEach {
            if (it.fileKey == null) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "missing attachment fileKey in instruction update"
                )
            }
        }

        service.updateInstruction(id, instruction, attachmentsMetadataDeserialized)
    }
}
