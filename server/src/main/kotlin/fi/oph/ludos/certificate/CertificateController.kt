package fi.oph.ludos.certificate

import fi.oph.ludos.*
import org.springframework.data.crossstore.ChangeSetPersister
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*
import javax.validation.Valid

@RestController
@Validated
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController(val service: CertificateService) {
    @PostMapping("")
    @HasYllapitajaRole
    fun createCertification(@Valid @RequestBody certificate: CertificateDtoIn) = service.createCertificate(certificate)

    @GetMapping("/{exam}")
    @HasAnyRole
    fun getCertificates(
        @PathVariable exam: Exam
    ) = service.getCertificates(exam)

    @GetMapping("/{exam}/{id}")
    @HasAnyRole
    fun getCertificate(@PathVariable exam: Exam, @PathVariable("id") id: Int) = service.getCertificateById(id, exam)

    @PutMapping("/{id}")
    @HasYllapitajaRole
    fun updateCertificate(
        @PathVariable("id") id: Int, @RequestBody certificate: CertificateDtoIn
    ): ResponseEntity<Int> = try {
        val updatedCertificateId = service.updateCertificate(id, certificate)
        ResponseEntity.status(HttpStatus.OK).body(updatedCertificateId)
    } catch (e: ChangeSetPersister.NotFoundException) {
        ResponseEntity.status(HttpStatus.NOT_FOUND).build()
    }

    @PostMapping("/upload")
    @HasYllapitajaRole
    fun uploadFile(@RequestParam("file") file: MultipartFile): ResponseEntity<FileUpload> {
        val key = "todistus_pohja_${UUID.randomUUID()}"

        // here will come s3 upload logic

        return ResponseEntity.status(HttpStatus.OK).body(
            FileUpload(
                file.originalFilename!!, "https://amazon_url.com/${key}", Date()
            )
        )
    }
}
