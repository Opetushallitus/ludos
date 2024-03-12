package fi.oph.ludos.aws

import software.amazon.awssdk.auth.credentials.AwsCredentialsProviderChain
import software.amazon.awssdk.auth.credentials.ContainerCredentialsProvider
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider
import software.amazon.awssdk.regions.Region


val AWS_REGION = Region.EU_WEST_1
fun awsCredentialsProviderChain(localAwsProfileName: String?): AwsCredentialsProviderChain {

    val providerChain = AwsCredentialsProviderChain.builder()
        .addCredentialsProvider(EnvironmentVariableCredentialsProvider.create())
        .addCredentialsProvider(ContainerCredentialsProvider.builder().build())

    if (localAwsProfileName != null) {
        providerChain.addCredentialsProvider(
            ProfileCredentialsProvider.builder().profileName(localAwsProfileName).build()
        )
    }
    return providerChain.build()
}