package fi.oph.ludos.certificate

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.validation.Valid
import org.springframework.core.io.InputStreamResource
import org.springframework.http.*
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.Duration

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
        service.getCertificateById(id, exam, null) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Certificate $id not found"
        )

    @GetMapping("{exam}/{id}/{version}")
    @RequireAtLeastYllapitajaRole
    fun getCertificateVersion(
        @PathVariable exam: Exam,
        @PathVariable("id") id: Int,
        @PathVariable("version") version: Int
    ): CertificateOut = service.getCertificateById(id, exam, version) ?: throw ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Certificate $id or its version $version not found"
    )

    @GetMapping("{exam}/{id}/versions")
    @RequireAtLeastYllapitajaRole
    fun getAllVersionsOfCertificate(@PathVariable exam: Exam, @PathVariable id: Int): List<CertificateOut> =
        service.getAllVersionsOfCertificate(exam, id)

    @PutMapping("/{id}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @RequireAtLeastYllapitajaRole
    fun createNewVersionOfCertificate(
        @PathVariable("id") id: Int,
        @Valid @RequestPart("certificate") certificate: Certificate,
        @RequestPart("attachmentFi") attachment: MultipartFile?,
        @RequestPart("attachmentSv") attachmentSv: MultipartFile?
    ): Int = service.createNewVersionOfCertificate(id, certificate, attachment, attachmentSv)
        ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Certificate $id not found"
        )

    @PostMapping("{exam}/{id}/{version}/restore")
    @RequireAtLeastYllapitajaRole
    fun restoreOldVersionOfCertificate(
        @PathVariable exam: Exam,
        @PathVariable id: Int,
        @PathVariable version: Int,
    ): Int = service.restoreOldVersionOfCertificate(exam, id, version)
        ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Certificate $id not found"
        )

    @GetMapping("/attachment/{key}")
    @RequireAtLeastOpettajaRole
    fun getAttachment(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val (uploadFile, attachmentInputStream) = service.getAttachment(key)

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${uploadFile.fileName}\"")
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
            .body(InputStreamResource(attachmentInputStream))
    }
}
