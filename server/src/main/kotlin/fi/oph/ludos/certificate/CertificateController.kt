package fi.oph.ludos.certificate

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.validation.Valid
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@RestController
@Validated
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController(val service: CertificateService) {
    @PostMapping("", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @RequireAtLeastYllapitajaRole
    fun createCertificate(
        @Valid @RequestPart("certificate") certificate: Certificate,
        @RequestPart("attachmentFi") attachment: MultipartFile,
        @RequestPart("attachmentSv") attachmentSv: MultipartFile?
    ): Certificate = when (certificate) {
        is SukoCertificateDtoIn -> service.createSukoCertificate(certificate, attachment)
        is LdCertificateDtoIn -> if (attachmentSv != null) service.createLdCertificate(
            certificate,
            attachment,
            attachmentSv
        ) else throw ResponseStatusException(HttpStatus.BAD_REQUEST, "attachmentSv missing")

        is PuhviCertificateDtoIn -> if (attachmentSv != null) service.createPuhviCertificate(
            certificate,
            attachment,
            attachmentSv
        ) else throw ResponseStatusException(HttpStatus.BAD_REQUEST, "attachmentSv missing")

        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
    }

    @GetMapping("SUKO")
    @RequireAtLeastOpettajaRole
    fun getSukoCertificates(
        @Valid filters: CertificateFilters
    ): CertificatesOut = CertificatesOut(service.getCertificates(Exam.SUKO, filters))

    @GetMapping("PUHVI")
    @RequireAtLeastOpettajaRole
    fun getPuhviCertificates(
        @Valid filters: CertificateFilters
    ): CertificatesOut = CertificatesOut(service.getCertificates(Exam.PUHVI, filters))

    @GetMapping("LD")
    @RequireAtLeastOpettajaRole
    fun getLdCertificates(
        @Valid filters: CertificateFilters
    ): CertificatesOut = CertificatesOut(service.getCertificates(Exam.LD, filters))

    @GetMapping("/{exam}/{id}")
    @RequireAtLeastOpettajaRole
    fun getCertificateById(@PathVariable exam: Exam, @PathVariable("id") id: Int): CertificateOut? =
        service.getCertificateById(id, exam) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Certificate not found $id"
        )

    @PutMapping("/{id}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @RequireAtLeastYllapitajaRole
    fun updateCertificate(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("certificate") certificate: Certificate,
        @RequestPart("attachmentFi") attachment: MultipartFile?,
        @RequestPart("attachmentSv") attachmentSv: MultipartFile?
    ): Int? = when (certificate) {
        is SukoCertificateDtoIn -> service.updateSukoCertificate(id, certificate, attachment)
        is LdCertificateDtoIn -> service.updateLdCertificate(
            id,
            certificate,
            attachment,
            attachmentSv
        )

        is PuhviCertificateDtoIn -> service.updatePuhviCertificate(
            id,
            certificate,
            attachment,
            attachmentSv
        )

        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
    }

    @GetMapping("/attachment/{key}")
    @RequireAtLeastOpettajaRole
    fun getAttachment(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val (uploadFile, attachmentInputStream) = service.getAttachment(key)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${uploadFile.fileName}\"")

        return ResponseEntity(InputStreamResource(attachmentInputStream), headers, HttpStatus.OK)
    }
}
