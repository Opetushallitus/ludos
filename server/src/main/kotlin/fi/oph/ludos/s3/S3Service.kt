package fi.oph.ludos.s3

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import java.io.InputStream
import java.util.*
import javax.annotation.PostConstruct

@Service
class S3Service(val s3: S3Client) {
    @Value("\${ludos.certificate-bucket-name}")
    lateinit var bucket: String

    private final val logger: Logger = LoggerFactory.getLogger(javaClass)

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

        return s3.getObject(objectRequest)
    }

    fun deleteObject(key: String) {
        val objectRequest = DeleteObjectRequest.builder().bucket(bucket).key(key).build()
        logger.info("Deleting object with key $key from bucket $bucket")

        s3.deleteObject(objectRequest)
    }
}