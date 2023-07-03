package fi.oph.ludos.s3

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import java.io.InputStream
import java.util.*
import javax.annotation.PostConstruct

@Component
class S3Helper(val s3: S3Client) {
    @Value("\${ludos.certificate-bucket-name}")
    lateinit var bucket: String
    val logger: Logger = LoggerFactory.getLogger(javaClass)


    @PostConstruct
    fun checkS3Credentials() {
        val objectRequest =
            PutObjectRequest.builder().bucket(bucket).key("ludos_app_s3_client_initialization_test").build()
        s3.putObject(objectRequest, RequestBody.empty())
    }

    fun putObject(file: MultipartFile, key: String) {
        val inputStream: InputStream = file.inputStream

        val objectRequest = PutObjectRequest.builder().bucket(bucket).key(key).contentType(file.contentType).build()

        s3.putObject(
            objectRequest, RequestBody.fromInputStream(inputStream, file.size)
        )
    }

    fun getObject(key: String): ResponseInputStream<GetObjectResponse>? {
        val objectRequest = GetObjectRequest.builder().bucket(bucket).key(key).build()

        return try {
            s3.getObject(objectRequest)
        } catch (ex: NoSuchKeyException) {
            null
        } catch (ex: SdkException) {
            logger.error("Unexpected error getting object '$key' from S3")
            throw ex
        }
    }

    fun deleteObject(key: String) {
        val objectRequest = DeleteObjectRequest.builder().bucket(bucket).key(key).build()

        try {
            s3.deleteObject(objectRequest)
        } catch (ex: SdkException) {
            logger.error("Unexpected error getting object '$key' from S3")
        }
    }
}