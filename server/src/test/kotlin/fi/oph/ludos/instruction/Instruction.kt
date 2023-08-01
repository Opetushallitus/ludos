package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp

data class TestInstructionIn(
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val publishState: PublishState,
    val exam: Exam
)

data class TestInstructionOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val publishState: PublishState,
    val authorOid: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)
