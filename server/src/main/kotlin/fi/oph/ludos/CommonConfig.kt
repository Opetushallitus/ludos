package fi.oph.ludos

import org.apache.http.client.config.RequestConfig
import org.apache.http.impl.client.HttpClientBuilder
import java.util.concurrent.TimeUnit

fun ludosHttpClientBuilder(): HttpClientBuilder =
    HttpClientBuilder.create()
        .setConnectionTimeToLive(30, TimeUnit.SECONDS)
        .disableRedirectHandling()
        .setDefaultRequestConfig(
            RequestConfig.custom()
                .setConnectTimeout(10000)
                .setSocketTimeout(20000)
                .setConnectionRequestTimeout(30000)
                .build()
        )