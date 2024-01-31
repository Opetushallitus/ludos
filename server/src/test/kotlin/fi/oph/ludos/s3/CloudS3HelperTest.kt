package fi.oph.ludos.s3

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.mock.env.MockEnvironment
import org.springframework.mock.web.MockMultipartFile
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CloudS3HelperTest {
    private val environment = MockEnvironment()
        .withProperty("ludos.local-dev-aws-profile", "oph-ludos-dev")
        .withProperty("ludos.certificate-bucket-name", "ludos-application-certificate-bucket-untuva")
    private val s3Client = S3Config().s3Client(environment)
    private val s3Helper = CloudS3Helper(environment, s3Client)
    private val testBucket = Bucket.CERTIFICATE
    private val filesToCleanUp = mutableListOf<String>()

    @AfterAll
    fun cleanup() {
        filesToCleanUp.forEach {
            rawDeleteIfExists(it)
        }
    }

    private fun rawDeleteIfExists(key: String) {
        s3Client.deleteObject(
            DeleteObjectRequest.builder().bucket(testBucket.getBucketName(environment)).key(key).build()
        )
    }

    private fun getNewTestFileKey(): String {
        filesToCleanUp.add("testfile_${filesToCleanUp.size}")
        rawDeleteIfExists(filesToCleanUp.last())
        return filesToCleanUp.last()
    }

    @Test
    fun `getting non-existent object returns null`() {
        val inputStream = s3Helper.getObject(testBucket, "does-not-exist")
        assertThat(inputStream).isNull()
    }

    private fun putNewObject(): String {
        val fileKey = getNewTestFileKey()
        s3Helper.putObject(testBucket, fileKey, MockMultipartFile("blaa", "contentti".byteInputStream()))
        val inputStream = s3Helper.getObject(testBucket, fileKey)
        assertThat(inputStream).isNotNull()
        if (inputStream != null) {
            assertThat(String(inputStream.readAllBytes())).isEqualTo("contentti")
        }
        return fileKey
    }

    @Test
    fun `put and get object`() {
        putNewObject()
    }

    @Test
    fun `delete object`() {
        val fileKey = putNewObject()
        s3Helper.deleteObject(testBucket, fileKey)
        val inputStream = s3Helper.getObject(testBucket, fileKey)
        assertThat(inputStream).isNull()
    }
}