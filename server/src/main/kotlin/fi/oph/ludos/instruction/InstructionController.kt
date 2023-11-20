package fi.oph.ludos.instruction

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.servlet.http.Part
import jakarta.validation.Valid
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

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
                HttpStatus.BAD_REQUEST,
                "Got ${nonNullAttachments.size} attachments, but ${nonNullAttachmentsMetadata.size} metadata"
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

    @PutMapping("/{id}")
    @RequireAtLeastYllapitajaRole
    fun updateInstruction(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("instruction") instruction: Instruction,
        @RequestPart("attachments-metadata", required = false) attachmentsMetadata: List<Part>?
    ): Int? {
        val attachmentsMetadataDeserialized: List<InstructionAttachmentMetadataDtoIn> =
            attachmentsMetadata?.map { objectMapper.readValue(it.inputStream) } ?: emptyList()

        attachmentsMetadataDeserialized.forEach {
            if (it.fileKey == null) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "missing attachment fileKey in instruction update"
                )
            }
        }

        return service.updateInstruction(id, instruction, attachmentsMetadataDeserialized)
    }

    @GetMapping("/SUKO")
    @RequireAtLeastOpettajaRole
    fun getSukoInstructions(
        @Valid filters: SukoInstructionFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> =
        service.getInstructions(Exam.SUKO, filters)

    @GetMapping("/LD")
    @RequireAtLeastOpettajaRole
    fun getLdInstructions(
        @Valid filters: LdInstructionFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> =
        service.getInstructions(Exam.LD, filters)

    @GetMapping("/PUHVI")
    @RequireAtLeastOpettajaRole
    fun getPuhviInstructions(
        @Valid filters: PuhviInstructionFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> =
        service.getInstructions(Exam.PUHVI, filters)

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

    @GetMapping("/attachment/{key}")
    @RequireAtLeastOpettajaRole
    fun previewFile(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val (uploadFile, responseInputStream) = service.getAttachment(key)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${uploadFile.fileName}\"")

        return ResponseEntity(InputStreamResource(responseInputStream), headers, HttpStatus.OK)
    }
}
