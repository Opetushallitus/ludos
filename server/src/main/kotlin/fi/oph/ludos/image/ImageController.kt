package fi.oph.ludos.image

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("${Constants.API_PREFIX}/image")
@RequireAtLeastYllapitajaRole
class ImageController(val service: ImageService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun uploadImage(@RequestPart("file") file: MultipartFile): ImageDtoOut {
        if (file.originalFilename == "this-will-fail.png") {
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed successfully :)")
        }

        val allowedMimeTypes = setOf("image/jpeg", "image/png", "image/gif", "image/svg+xml")

        if (!allowedMimeTypes.contains(file.contentType)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type: ${file.contentType}")
        }

        return service.uploadImage(file)
    }

    @GetMapping("{fileKey}")
    @RequireAtLeastOpettajaRole
    fun getImage(@PathVariable("fileKey") fileKey: String): ResponseEntity<InputStreamResource> {
        val response = service.getImageByFileKey(fileKey)
        val contentType = response.response().contentType()

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .body(InputStreamResource(response))
    }
}