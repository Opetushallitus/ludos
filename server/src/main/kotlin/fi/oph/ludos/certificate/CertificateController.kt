package fi.oph.ludos.certificate

import fi.oph.ludos.*
import fi.oph.ludos.s3.S3Service
import org.springframework.core.io.InputStreamResource
import org.springframework.data.crossstore.ChangeSetPersister
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.text.SimpleDateFormat
import java.util.*
import javax.validation.Valid
import javax.validation.constraints.Size

@RestController
@Validated
@RequestMapping("${Constants.API_PREFIX}/certificate")
class CertificateController(
    val service: CertificateService,
    val s3Service: S3Service
) {
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
    fun uploadFile(@RequestParam("file") file: MultipartFile) = try {
        if (file.contentType != MediaType.APPLICATION_PDF_VALUE) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                "Invalid file type. Only PDF files are allowed."
            )
        }

        // 5MB
        val maxFileSize = 5 * 1024 * 1024

        if (file.size > maxFileSize) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                "File size exceeds the limit. Maximum file size allowed is 5MB."
            )
        }

        val key = "todistus_${UUID.randomUUID()}"

        s3Service.putObject(file, key)

        ResponseEntity.status(HttpStatus.OK).body(
            FileUpload(
                file.originalFilename!!, key, getCurrentDate()
            )
        )
    } catch (e: Exception) {
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            "Failed to upload file: ${e.message}"
        )
    }

    fun getCurrentDate(): String {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd")
        val currentDate = Date()
        return dateFormat.format(currentDate)
    }

    @GetMapping("/preview/{key}")
    @HasAnyRole
    fun previewFile(@PathVariable("key") key: String): ResponseEntity<InputStreamResource> {
        val responseInputStream = s3Service.getObject(key)

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
