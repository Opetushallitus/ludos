package fi.oph.ludos.assignment

import fi.oph.ludos.PublishState
import java.sql.Timestamp

interface TestAssignmentIn {
    val exam: String
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val instructionFi: String
    val instructionSv: String
    val publishState: String
}

data class TestAssignmentSukoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: String,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
) : TestAssignmentIn

data class TestAssignmentSukoOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: String,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val authorOid: String,
    val createdAt: String,
    val updatedAt: String
)

data class TestAssignmentPuhviOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val authorOid: String,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

data class TestAssignmentLdOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val createdAt: Timestamp,
    val updatedAt: Timestamp,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val authorOid: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
)
