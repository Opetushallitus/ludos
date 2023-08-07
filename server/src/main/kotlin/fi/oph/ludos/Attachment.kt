package fi.oph.ludos

import java.time.ZonedDateTime

interface AttachmentOut {
    val fileKey: String
    val fileName: String
    val fileUploadDate: ZonedDateTime
}
