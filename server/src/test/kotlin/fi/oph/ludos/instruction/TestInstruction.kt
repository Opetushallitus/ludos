package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState

interface TestInstruction {
    val exam: Exam
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val publishState: PublishState
}

data class TestSukoInstructionDtoIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String
) : TestInstruction

data class TestPuhviInstructionDtoIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String
) : TestInstruction

data class TestLdInstructionDtoIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    val aineKoodiArvo: String
) : TestInstruction