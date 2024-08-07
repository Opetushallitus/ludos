package fi.oph.ludos.instruction

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.Part
import jakarta.validation.Valid
import org.springframework.core.io.InputStreamResource
import org.springframework.http.*
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.Duration

@RestController
@RequestMapping("${Constants.API_PREFIX}/instruction")
@RequireAtLeastYllapitajaRole
class InstructionController(val service: InstructionService, private val objectMapper: ObjectMapper) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun createInstruction(
        @Valid @RequestPart("instruction") instruction: InstructionIn,
        @RequestPart("attachments", required = false) attachments: List<MultipartFile>?,
        @RequestPart("attachments-metadata", required = false) attachmentsMetadata: List<Part>?,
        request: HttpServletRequest
    ): InstructionOut? {
        val nonNullAttachments = attachments ?: emptyList()
        val nonNullAttachmentsMetadata = attachmentsMetadata ?: emptyList()
        validateNewAttachments(nonNullAttachments, nonNullAttachmentsMetadata)

        val attachmentMetadataDeserialized = deserializeAttachmentsMetadata(nonNullAttachmentsMetadata)
        val attachmentIns = createAttachmentIns(nonNullAttachments, attachmentMetadataDeserialized)

        return service.createInstruction(instruction, attachmentIns, request)
    }

    @PutMapping("/{id}")
    @RequireAtLeastYllapitajaRole
    fun createNewVersionOfInstruction(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("instruction") instruction: InstructionIn,
        @RequestPart("attachments-metadata", required = false) attachmentsMetadata: List<Part>?,
        @RequestPart("new-attachments", required = false) newAttachments: List<MultipartFile>?,
        @RequestPart("new-attachments-metadata", required = false) newAttachmentsMetadata: List<Part>?,
        request: HttpServletRequest
    ): Int {
        val attachmentsMetadataDeserialized = deserializeAttachmentsMetadata(attachmentsMetadata)
        validateExistingAttachmentsMetadata(attachmentsMetadataDeserialized)

        val newNonNullAttachments = newAttachments ?: emptyList()
        val newNonNullAttachmentsMetadata = newAttachmentsMetadata ?: emptyList()
        validateNewAttachments(newNonNullAttachments, newNonNullAttachmentsMetadata)

        val newAttachmentMetadataDeserialized = deserializeAttachmentsMetadata(newNonNullAttachmentsMetadata)

        val newAttachmentIns = createAttachmentIns(newNonNullAttachments, newAttachmentMetadataDeserialized)

        val createdVersion =
            service.createNewVersionOfInstruction(
                id,
                instruction,
                attachmentsMetadataDeserialized,
                newAttachmentIns,
                request
            )

        return createdVersion ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Instruction $id not found")
    }

    private fun createAttachmentIns(
        nonNullAttachments: List<MultipartFile>,
        attachmentMetadataDeserialized: List<InstructionAttachmentMetadataDtoIn>
    ): List<InstructionAttachmentIn> = nonNullAttachments.indices.map {
        InstructionAttachmentIn(
            nonNullAttachments[it], attachmentMetadataDeserialized[it]
        )
    }

    private fun deserializeAttachmentsMetadata(metadata: List<Part>?): List<InstructionAttachmentMetadataDtoIn> =
        metadata?.map { objectMapper.readValue(it.inputStream) } ?: emptyList()

    private fun validateExistingAttachmentsMetadata(metadata: List<InstructionAttachmentMetadataDtoIn>) {
        metadata.forEach { if (it.fileKey == null) throwBadRequest("missing attachment fileKey in instruction update") }
    }

    private fun validateNewAttachments(attachments: List<MultipartFile>, metadata: List<Part>) {
        if (attachments.size != metadata.size) {
            throwBadRequest("Got ${attachments.size} attachments, but ${metadata.size} metadata")
        }
    }

    private fun throwBadRequest(message: String): Nothing {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, message)
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
    fun getInstruction(@PathVariable exam: Exam, @PathVariable("id") id: Int): InstructionOut =
        service.getInstructionById(exam, id) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Instruction $id not found"
        )

    @GetMapping("/{exam}/{id}/versions")
    @RequireAtLeastYllapitajaRole
    fun getAllVersionsOfInstruction(@PathVariable exam: Exam, @PathVariable id: Int): List<InstructionOut> =
        service.getAllVersionsOfInstruction(exam, id)

    @GetMapping("/{exam}/{id}/{version}")
    @RequireAtLeastYllapitajaRole
    fun getInstructionVersion(
        @PathVariable exam: Exam,
        @PathVariable("id") id: Int,
        @PathVariable("version") version: Int
    ): InstructionOut = service.getInstructionById(exam, id, version) ?: throw ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Instruction $id or its version $version not found"
    )

    @PostMapping("/{exam}/{id}/{version}/restore")
    @RequireAtLeastYllapitajaRole
    fun restoreOldVersionOfInstruction(
        @PathVariable exam: Exam,
        @PathVariable id: Int,
        @PathVariable version: Int,
        request: HttpServletRequest
    ): Int = service.restoreOldVersionOfInstruction(exam, id, version, request)
        ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "$exam instruction $id or its version $version not found"
        )

    fun attachmentResponse(exam: Exam, attachmentKey: String, version: Int?): ResponseEntity<InputStreamResource> {
        val (uploadFile, attachmentInputStream) = service.getAttachment(exam, attachmentKey, version)

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${uploadFile.fileName}\"")
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
            .body(InputStreamResource(attachmentInputStream))
    }

    @GetMapping("/{exam}/attachment/{key}")
    @RequireAtLeastOpettajaRole
    fun downloadAttachment(
        @PathVariable exam: Exam,
        @PathVariable("key") key: String,
    ): ResponseEntity<InputStreamResource> = attachmentResponse(exam, key, null)

    @GetMapping("/{exam}/attachment/{key}/{version}")
    @RequireAtLeastYllapitajaRole
    fun previewAttachmentVersion(
        @PathVariable exam: Exam,
        @PathVariable("key") key: String,
        @PathVariable("version") version: Int
    ): ResponseEntity<InputStreamResource> = attachmentResponse(exam, key, version)
}
