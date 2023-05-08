package fi.oph.ludos.certificate

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.ExamType
import fi.oph.ludos.State
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController {
    @PostMapping("")
    fun createAssignment(@RequestBody assignment: Any): Any = ResponseEntity.status(HttpStatus.OK).body(assignment)

    @GetMapping("/{exam}")
    fun getCertificates(
        @PathVariable exam: Exam
    ): List<Any> = listOf()

    @GetMapping("/{exam}/{id}")
    fun getCertificate(@PathVariable exam: Exam, @PathVariable("id") id: Int): Certificate = Certificate(
        nameFi = "nameFi",
        contentFi = "contentFi",
        nameSv = "nameSv",
        contentSv = "contentSv",
        state = State.DRAFT,
        examType = ExamType.CERTIFICATES
    )
}

data class Certificate(
    val nameFi: String,
    val contentFi: String,
    val nameSv: String,
    val contentSv: String,
    val state: State,
    val examType: ExamType
)