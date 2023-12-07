package fi.oph.ludos.image

import fi.oph.ludos.Constants
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import java.util.*

@Service
class ImageService(val s3Helper: S3Helper) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun uploadImage(file: MultipartFile): ImageDtoOut {
        val fileKey = "image_${UUID.randomUUID()}"

        try {
            s3Helper.putObject(Bucket.IMAGE, fileKey, file)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to upload image '${file.originalFilename}' to S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        }

        return ImageDtoOut(
            "${Constants.API_PREFIX}/image/${fileKey}",
            file.originalFilename ?: ""
        )
    }

    fun getImageByFileKey(key: String): ResponseInputStream<GetObjectResponse> {
        val responseStream = try {
            s3Helper.getObject(Bucket.IMAGE, key)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to get image '$key' from S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Image '$key' not found in S3")

        return responseStream
    }
}