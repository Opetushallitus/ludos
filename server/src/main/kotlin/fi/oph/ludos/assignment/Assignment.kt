package fi.oph.ludos.assignment

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.PublishState
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import fi.oph.ludos.koodisto.ValidKoodiArvos
import java.sql.Timestamp
import java.util.*
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Pattern

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoIn::class, name = "LD")
)
interface Assignment {
    @get:NotBlank
    val nameFi: String
    @get:NotBlank
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val instructionFi: String
    val instructionSv: String
    val publishState: PublishState
    @get:ValidKoodiArvos(koodisto = KoodistoName.LAAJA_ALAINEN_OSAAMINEN_LOPS2021)
    val laajaalainenOsaaminenKoodiArvos: Array<String>
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_SUKO)
    val assignmentTypeKoodiArvo: String,
    @field:ValidKoodiArvo(koodisto = KoodistoName.OPPIAINEET_JA_OPPIMAARAT_LOPS2021)
    val oppimaaraKoodiArvo: String,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TAITOTASO)
    val tavoitetasoKoodiArvo: String,
    @field:ValidKoodiArvos(koodisto = KoodistoName.AIHE_SUKO)
    val aiheKoodiArvos: Array<String>,
) : Assignment

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_PUHVI)
    val assignmentTypeKoodiArvo: String,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    val lukuvuosiKoodiArvos: Array<String>,
) : Assignment

@JsonTypeName("LD")
data class LdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    val lukuvuosiKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    val aineKoodiArvo: String
) : Assignment

interface AssignmentOut {
    val id: Int
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class SukoAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String,
    val aiheKoodiArvos: Array<String>
) : Assignment, AssignmentOut

data class PuhviAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>
) : Assignment, AssignmentOut

data class LdAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
) : Assignment, AssignmentOut

interface AssignmentFilter {
    @get:Pattern(regexp = "^(asc|desc)\$")
    val orderDirection: String?
}

data class SukoAssignmentFilter(
    override val orderDirection: String?,
    @Pattern(regexp = "^[a-zA-Z]+\$")
    val oppimaara: String?,
    @Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppisuko: String?,
    @Pattern(regexp = "^[0-9,]+\$")
    val aihe: String?,
    @Pattern(regexp = "^[0-9,]+\$")
    val tavoitetaitotaso: String?,
): AssignmentFilter

data class LdAssignmentFilter(
    override val orderDirection: String?,
    @Pattern(regexp = "^[0-9]+\$")
    val lukuvuosi: String?,
    @Pattern(regexp = "^[0-9,]+\$")
    val aine: String?,
): AssignmentFilter

data class PuhviAssignmentFilter(
    override val orderDirection: String?,
    @Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppipuhvi: String?,
    @Pattern(regexp = "^[0-9]+\$")
    val lukuvuosi: String?,
): AssignmentFilter
