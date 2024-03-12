package fi.oph.ludos.aws

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class S3Config {
    @Bean
    @Profile("!local")
    fun s3Client(
        environment: Environment
    ): S3Client {
        val providerChain = awsCredentialsProviderChain(environment.getProperty("ludos.local-dev-aws-profile"))

        return S3Client.builder().region(AWS_REGION).credentialsProvider(providerChain).build()
    }

}