package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
class InstructionService(val db: InstructionRepository) {
    fun createInstruction(instruction: Instruction, attachments: List<InstructionAttachmentIn>) =
        db.createInstruction(instruction, attachments)

    fun getInstructions(exam: Exam): List<InstructionOut> = db.getInstructions(exam)

    fun getInstructionById(exam: Exam, id: Int): InstructionOut? = db.getInstructionById(exam, id)

    fun uploadAttachmentToInstruction(exam: Exam, instructionId: Int, metadata: InstructionAttachmentMetadataDtoIn, file: MultipartFile) =
        db.uploadAttachmentToInstruction(exam, instructionId, metadata, file)

    fun deleteAttachmentFromInstruction(fileKey: String) = db.deleteAttachment(fileKey)

    fun updateInstruction(
        id: Int, instruction: Instruction, attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ) = db.updateInstruction(id, instruction, attachmentsMetadata)
}