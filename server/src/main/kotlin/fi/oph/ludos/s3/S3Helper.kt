package fi.oph.ludos.s3

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import java.io.InputStream
import javax.annotation.PostConstruct

enum class Bucket(val bucketNameProperty: String) {
    INSTRUCTION("ludos.instruction-bucket-name"),
    CERTIFICATE("ludos.certificate-bucket-name")
}

interface S3Helper {
    fun putObject(bucket: Bucket, key: String, file: MultipartFile)
    fun getObject(bucket: Bucket, key: String): ResponseInputStream<GetObjectResponse>?
    fun deleteObject(bucket: Bucket, key: String)
}

@Component
//@Profile("!local")
class CloudS3Helper(val environment: Environment, val s3: S3Client) : S3Helper {
    var bucketNameByBucket: MutableMap<Bucket, String> = HashMap()
    val logger: Logger = LoggerFactory.getLogger(javaClass)


    @PostConstruct
    fun checkS3Credentials() {
        Bucket.values().forEach {
            this.bucketNameByBucket[it] = environment.getProperty(it.bucketNameProperty)
                ?: throw IllegalStateException("Property '${it.bucketNameProperty}' not set")

            val objectRequest =
                PutObjectRequest.builder()
                    .bucket(this.bucketNameByBucket[it])
                    .key("ludos_app_s3_client_initialization_test")
                    .build()
            s3.putObject(objectRequest, RequestBody.empty())
        }
    }

    override fun putObject(bucket: Bucket, key: String, file: MultipartFile) {
        val inputStream: InputStream = file.inputStream

        val objectRequest =
            PutObjectRequest.builder().bucket(bucketNameByBucket[bucket]).key(key).contentType(file.contentType).build()

        s3.putObject(
            objectRequest, RequestBody.fromInputStream(inputStream, file.size)
        )
    }

    override fun getObject(bucket: Bucket, key: String): ResponseInputStream<GetObjectResponse>? {
        val objectRequest = GetObjectRequest.builder().bucket(bucketNameByBucket[bucket]).key(key).build()

        return try {
            s3.getObject(objectRequest)
        } catch (ex: NoSuchKeyException) {
            null
        } catch (ex: SdkException) {
            logger.error("Unexpected error getting object '$key' from S3")
            throw ex
        }
    }

    override fun deleteObject(bucket: Bucket, key: String) {
        val objectRequest = DeleteObjectRequest.builder().bucket(bucketNameByBucket[bucket]).key(key).build()

        try {
            s3.deleteObject(objectRequest)
        } catch (ex: SdkException) {
            logger.error("Unexpected error getting object '$key' from S3")
        }
    }
}
