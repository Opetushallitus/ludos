package fi.oph.ludos.s3

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class S3Config {
    @Bean
    fun s3Client(
        profile: String,
    ): S3Client = S3Client.builder().region(Region.EU_WEST_1)
        .credentialsProvider(ProfileCredentialsProvider.builder().profileName(profile).build()).build()
}
