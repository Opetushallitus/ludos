package fi.oph.ludos

import java.sql.Timestamp

interface AttachmentOut {
    val fileKey: String
    val fileName: String
    val fileUploadDate: Timestamp
}
