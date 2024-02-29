package fi.oph.ludos.aws

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.AppenderBase
import ch.qos.logback.core.Layout
import org.slf4j.LoggerFactory
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient
import software.amazon.awssdk.services.cloudwatchlogs.model.CreateLogStreamRequest
import software.amazon.awssdk.services.cloudwatchlogs.model.PutLogEventsRequest

class LudosLogbackCloudwatchAppender :
    AppenderBase<ILoggingEvent>() {
    private val logger = LoggerFactory.getLogger(javaClass)

    // <logback-spring.xml-attributes>
    var layout: Layout<ILoggingEvent>? = null
    var localAwsProfileName: String? = null
    var logGroupName: String? = null
    // </logback-spring.xml-attributes>

    private lateinit
    var cloudWatchLogsClient: CloudWatchLogsClient

    private val logStreamName: String = getEcsTaskIdFromEnv()

    override fun start() {
        if (started) {
            return
        }

        checkNotNull(layout) { "Layout was not set for appender" }
        checkNotNull(localAwsProfileName) { "localAwsProfileName was not set for appender" }
        if (localAwsProfileName!!.isBlank()) {
            throw IllegalStateException("localAwsProfileName was blank")
        }
        checkNotNull(logGroupName) { "logGroupName was not set for appender" }
        if (logGroupName!!.isBlank()) {
            throw IllegalStateException("logGroupName was blank")
        }

        cloudWatchLogsClient = CloudWatchLogsClient.builder()
            .region(AWS_REGION)
            .credentialsProvider(awsCredentialsProviderChain(localAwsProfileName))
            .build()
        val createLogStreamRequest = CreateLogStreamRequest.builder()
            .logGroupName(logGroupName).logStreamName(logStreamName).build()
        cloudWatchLogsClient.createLogStream(createLogStreamRequest)

        super.start()
    }

    override fun append(eventObject: ILoggingEvent) {
        val message = eventObject.formattedMessage
        val request = PutLogEventsRequest.builder()
            .logGroupName(logGroupName)
            .logStreamName(logStreamName)
            .logEvents(
                software.amazon.awssdk.services.cloudwatchlogs.model.InputLogEvent.builder()
                    .message(layout?.doLayout(eventObject) ?: throw IllegalStateException("Layout was not set"))
                    .timestamp(eventObject.timeStamp)
                    .build()
            )
            .build()

        try {
            cloudWatchLogsClient.putLogEvents(request)
        } catch (e: Throwable) {
            logger.error("Error calling put-log-events($message)", e)
        }
    }
}

fun getEcsTaskIdFromEnv(): String {
    // Esimerkki ECS_CONTAINER_METADATA_URI:n muodosta:
    // http://169.254.170.2/v3/2df36241782d45e5ad3816ea5cc10f61-2990360344
    val metadataUri = System.getenv("ECS_CONTAINER_METADATA_URI")
    val taskId = metadataUri?.split("/")?.last()?.split("-")?.first()
    return taskId ?: ("unknown_task_id-" + System.currentTimeMillis())
}