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
    fun getCertificate(@PathVariable exam: Exam, @PathVariable("id") id: Int): ResponseEntity<out Any> {
        val certificateDtoOut = service.getCertificateById(id, exam)

        return if (certificateDtoOut == null) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body("Certificate not found $id")
        } else {
            ResponseEntity.status(HttpStatus.OK).body(certificateDtoOut)
        }
    }

    @PutMapping("/{id}")
    @HasYllapitajaRole
    fun updateCertificate(
        @PathVariable("id") id: Int, @RequestBody certificate: CertificateDtoIn
    ): ResponseEntity<Any> {
        val updatedCertificateId = service.updateCertificate(id, certificate)

        return if (updatedCertificateId == null) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body("Certificate not found $id")
        } else {
            ResponseEntity.status(HttpStatus.OK).body(updatedCertificateId)
        }
    }

    @PostMapping("/upload")
    @HasYllapitajaRole
    fun uploadFile(@RequestParam("file") file: MultipartFile): ResponseEntity<FileUpload> {

        if (file.contentType.toString() != MediaType.APPLICATION_PDF_VALUE) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE")
        }
        // 5MB
        val maxFileSize = 5 * 1024 * 1024

        if (file.size > maxFileSize) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE"
            )
        }

        val uploadedFile = service.uploadFile(file) ?: throw ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR, "S3_ERROR_UPLOADING_FILE"
        )

        return ResponseEntity.status(HttpStatus.OK).body(uploadedFile)
    }

    @GetMapping("/preview/{key}")
    @HasAnyRole
    fun previewFile(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val responseInputStream = service.getFile(key)

        return if (responseInputStream != null) {
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_PDF
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=$key")

            ResponseEntity(InputStreamResource(responseInputStream), headers, HttpStatus.OK)
        } else {
            ResponseEntity(HttpStatus.NOT_FOUND)
        }
    }
}
