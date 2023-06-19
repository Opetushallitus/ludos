package fi.oph.ludos.s3

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import software.amazon.awssdk.auth.credentials.AwsCredentialsProviderChain
import software.amazon.awssdk.auth.credentials.ContainerCredentialsProvider
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class S3Config {
    @Bean
    fun s3Client(
        environment: Environment
    ): S3Client {
        val defaultRegion = Region.EU_WEST_1
        val localProfile = environment.getProperty("ludos.local-dev-aws-profile")

        val providerChain = AwsCredentialsProviderChain.builder()
            .addCredentialsProvider(EnvironmentVariableCredentialsProvider.create())
            .addCredentialsProvider(ContainerCredentialsProvider.builder().build())

        if (localProfile != null) {
            providerChain.addCredentialsProvider(ProfileCredentialsProvider.builder().profileName(localProfile).build())
        }

        return S3Client.builder().region(defaultRegion).credentialsProvider(providerChain.build()).build()
    }
}
