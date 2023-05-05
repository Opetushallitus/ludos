package fi.oph.ludos.certificate

import fi.oph.ludos.Constants
import fi.oph.ludos.assignment.Exam
import fi.oph.ludos.assignment.ExamType
import fi.oph.ludos.instruction.InstructionOut
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController {
    @GetMapping("/{exam}")
    fun getCertificates(
        @PathVariable exam: Exam, @RequestParam examType: ExamType
    ): List<Any> = listOf()

    @GetMapping("/{exam}/{id}")
    fun getCertificate(@PathVariable exam: Exam, @PathVariable("id") id: Int): Certificate = Certificate(
        id = id,
        exam = exam,
        examType = ExamType.CERTIFICATES,
        name = "Test Certificate",
        description = "Test Certificate Description",
        instructions = listOf()
    )
}

data class Certificate(
    val id: Int,
    val exam: Exam,
    val examType: ExamType,
    val name: String,
    val description: String,
    val instructions: List<InstructionOut>
)