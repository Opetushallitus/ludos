package fi.oph.ludos.s3

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.io.InputStream
import java.util.*

@Service
class S3Service(
    s3Config: S3Config,
    @Value("\${aws.profile}") profile: String
) {

    @Value("\${s3.bucketName}")
    lateinit var bucket: String

    private val s3 = s3Config.s3Client(profile)

    fun putObject(file: MultipartFile, key: String): String? {
        val inputStream: InputStream = file.inputStream

        val objectRequest = PutObjectRequest.builder().bucket(bucket).key(key).contentType(file.contentType).build()

        return s3.putObject(
            objectRequest, RequestBody.fromInputStream(inputStream, file.size)
        ).eTag()
    }

    fun getObject(key: String): ResponseInputStream<GetObjectResponse>? {
        val objectRequest = GetObjectRequest.builder().bucket(bucket).key(key).build()

        return s3.getObject(objectRequest)
    }
}