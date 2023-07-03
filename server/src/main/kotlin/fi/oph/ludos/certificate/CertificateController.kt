package fi.oph.ludos.certificate

import fi.oph.ludos.*
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.util.*
import javax.validation.Valid

@RestController
@Validated
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController(val service: CertificateService) {
    @PostMapping("", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @HasYllapitajaRole
    fun createCertificate(
        @Valid @RequestPart("certificate") certificate: CertificateDtoIn,
        @RequestPart("attachment") attachment: MultipartFile
    ): CertificateDtoOut? = service.createCertificate(certificate, attachment)

    @GetMapping("/{exam}")
    @HasAnyRole
    fun getCertificates(
        @PathVariable exam: Exam
    ) = service.getCertificates(exam)

    @GetMapping("/{exam}/{id}")
    @HasAnyRole
    fun getCertificateById(@PathVariable exam: Exam, @PathVariable("id") id: Int): CertificateDtoOut? {
        val certificateDtoOut = service.getCertificateById(id, exam)

        return certificateDtoOut ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found $id")
    }

    @PutMapping("/{id}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @HasYllapitajaRole
    fun updateCertificate(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("certificate") certificate: CertificateDtoIn,
        @RequestPart("attachment") attachment: MultipartFile?
    ) = service.updateCertificate(id, certificate, attachment)

    @GetMapping("/preview/{key}")
    @HasAnyRole
    fun previewFile(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val (uploadFile, responseInputStream) = service.getAttachment(key)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=${uploadFile.fileName}")

        return ResponseEntity(InputStreamResource(responseInputStream), headers, HttpStatus.OK)
    }
}
