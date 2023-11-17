package fi.oph.ludos.s3

import jakarta.annotation.PostConstruct
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import java.io.InputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import kotlin.io.path.deleteIfExists

enum class Bucket(private val bucketNameProperty: String) {
    INSTRUCTION("ludos.instruction-bucket-name"),
    CERTIFICATE("ludos.certificate-bucket-name"),
    IMAGE("ludos.image-bucket-name");

    fun getBucketName(environment: Environment): String =
        environment.getProperty(this.bucketNameProperty)
            ?: throw IllegalStateException("Property '${this.bucketNameProperty}' not set")
}

interface S3Helper {
    fun putObject(bucket: Bucket, key: String, file: MultipartFile)
    fun getObject(bucket: Bucket, key: String): ResponseInputStream<GetObjectResponse>?
    fun deleteObject(bucket: Bucket, key: String)
}

@Component
@Profile("!local")
class CloudS3Helper(val environment: Environment, val s3: S3Client) : S3Helper {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    @PostConstruct
    fun checkS3Credentials() {
        Bucket.entries.forEach {
            val objectRequest =
                PutObjectRequest.builder()
                    .bucket(it.getBucketName(environment))
                    .key("ludos_app_s3_client_initialization_test")
                    .build()
            s3.putObject(objectRequest, RequestBody.empty())
        }
    }

    override fun putObject(bucket: Bucket, key: String, file: MultipartFile) {
        val bucketName = bucket.getBucketName(environment)
        val inputStream: InputStream = file.inputStream

        val objectRequest = PutObjectRequest.builder().bucket(bucketName).key(key).contentType(file.contentType).build()

        try {
            s3.putObject(objectRequest, RequestBody.fromInputStream(inputStream, file.size))
        } catch (ex: SdkException) {
            logger.error("Unexpected error putting object '$key' to S3 bucket '${bucketName}", ex)
            throw ex
        }
        logger.info("Uploaded $key to $bucketName")
    }

    override fun getObject(bucket: Bucket, key: String): ResponseInputStream<GetObjectResponse>? {
        val bucketName = bucket.getBucketName(environment)
        val objectRequest = GetObjectRequest.builder().bucket(bucketName).key(key).build()

        return try {
            s3.getObject(objectRequest)
        } catch (ex: NoSuchKeyException) {
            null
        } catch (ex: SdkException) {
            logger.error("Unexpected error getting object '$key' from S3 bucket '${bucketName}'", ex)
            throw ex
        }
    }

    override fun deleteObject(bucket: Bucket, key: String) {
        val bucketName = bucket.getBucketName(environment)
        val objectRequest = DeleteObjectRequest.builder().bucket(bucketName).key(key).build()

        try {
            s3.deleteObject(objectRequest)
        } catch (ex: SdkException) {
            logger.error("Unexpected error deleting object '$key' from S3 bucket '${bucketName}'", ex)
            throw ex
        }
        logger.info("Deleted $key from $bucketName")
    }
}


@Component
@Profile("local")
class LocalS3Helper(val environment: Environment) : S3Helper {
    val logger: Logger = LoggerFactory.getLogger(javaClass)
    val s3Dir: Path = Paths.get(System.getProperty("java.io.tmpdir"), "ludos_local_s3")

    fun bucketDir(bucket: Bucket): Path = s3Dir.resolve(bucket.getBucketName(environment))

    @PostConstruct
    fun init() {
        if (!Files.exists(s3Dir)) {
            Files.createDirectories(s3Dir)
        }
        Bucket.entries.forEach {
            if (!Files.exists(bucketDir(it))) {
                Files.createDirectory(bucketDir(it))
            }
        }
    }

    private fun contentTypeFilePath(mainFilePath: Path): Path = Paths.get("$mainFilePath.contentType")

    override fun putObject(bucket: Bucket, key: String, file: MultipartFile) {
        try {
            val filePath = bucketDir(bucket).resolve(key)
            Files.newOutputStream(filePath).use { output ->
                file.inputStream.copyTo(output)
            }
            // Save content type in a separate file
            Files.writeString(contentTypeFilePath(filePath), file.contentType)
        } catch (e: Exception) {
            logger.error("Error putting $key to $bucket", e)
            throw e
        }
        logger.info("Uploaded $key to $bucket")
    }

    override fun getObject(bucket: Bucket, key: String): ResponseInputStream<GetObjectResponse>? {
        return try {
            val filePath = bucketDir(bucket).resolve(key)
            // Read the content type from the separate file
            val contentTypePath = contentTypeFilePath(filePath)
            val contentType =
                if (Files.exists(contentTypePath)) Files.readString(contentTypePath) else "application/octet-stream"

            val inputStream = Files.newInputStream(filePath)
            val objectResponse = GetObjectResponse.builder().contentType(contentType).build()

            ResponseInputStream(objectResponse, inputStream)
        } catch (e: Exception) {
            logger.error("Error getting $key from $bucket", e)
            null
        }
    }

    override fun deleteObject(bucket: Bucket, key: String) {
        try {
            val filePath = bucketDir(bucket).resolve(key)
            filePath.deleteIfExists()
            contentTypeFilePath(filePath).deleteIfExists()
        } catch (e: Exception) {
            logger.error("Error deleting $key from $bucket", e)
        }
        logger.info("Deleted $key from $bucket")
    }
}