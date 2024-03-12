package fi.oph.ludos.image

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.io.InputStreamResource
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.Duration

@RestController
@RequestMapping("${Constants.API_PREFIX}/image")
@RequireAtLeastYllapitajaRole
class ImageController(val service: ImageService) {
    @PostMapping("")
    @RequireAtLeastYllapitajaRole
    fun uploadImage(@RequestPart("file") file: MultipartFile, request: HttpServletRequest): ImageDtoOut {
        if (file.originalFilename == "this-will-fail.png") {
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed successfully :)")
        }

        return service.uploadImage(file, request)
    }

    @GetMapping("{fileKey}")
    @RequireAtLeastOpettajaRole
    fun getImage(@PathVariable("fileKey") fileKey: String): ResponseEntity<InputStreamResource> {
        val response = service.getImageByFileKey(fileKey)
        val contentType = response.response().contentType()

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
            .body(InputStreamResource(response))
    }
}