package fi.oph.ludos.assignment

import fi.oph.ludos.PublishState
import java.sql.Timestamp

data class TestSukoOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String,
    val aiheKoodiArvos: Array<String>,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

data class TestPuhviOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

data class TestLdOut(
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
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
)