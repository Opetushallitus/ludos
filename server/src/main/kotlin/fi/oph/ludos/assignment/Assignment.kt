package fi.oph.ludos.assignment

import BaseFilters
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.PublishState
import fi.oph.ludos.ValidContentDescription
import fi.oph.ludos.ValidContentName
import fi.oph.ludos.ValidHtmlContent
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import fi.oph.ludos.koodisto.ValidKoodiArvos
import java.sql.Timestamp
import javax.validation.Constraint
import javax.validation.ConstraintValidator
import javax.validation.ConstraintValidatorContext
import javax.validation.Payload
import javax.validation.constraints.Pattern
import kotlin.reflect.KClass

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoIn::class, name = "LD")
)
@AtLeastOneAssignmentNameIsNotBlank
interface Assignment {
    @get:ValidContentName
    val nameFi: String
    @get:ValidContentName
    val nameSv: String
    @get:ValidHtmlContent
    val contentFi: String
    @get:ValidHtmlContent
    val contentSv: String
    @get:ValidContentDescription
    val instructionFi: String
    @get:ValidContentDescription
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
    @JsonProperty(required = true) // always require tavoitetasoKoodiArvo field even if null
    val tavoitetasoKoodiArvo: String?,
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
    val authorOid: String
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
    override val authorOid: String,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
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
    override val authorOid: String,
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
    override val authorOid: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
) : Assignment, AssignmentOut

data class SukoBaseFilters(
    override val orderDirection: String?,
    // allow alphabetical letters, numbers and commas
    @field:Pattern(regexp = "^[a-zA-Z0-9,]+\$")
    val oppimaara: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppisuko: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aihe: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tavoitetaitotaso: String?,
): BaseFilters

data class LdBaseFilters(
    override val orderDirection: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aine: String?,
): BaseFilters

data class PuhviBaseFilters(
    override val orderDirection: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppipuhvi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
): BaseFilters

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AtLeastOneAssignmentNameIsNotEmptyValidator::class])
annotation class AtLeastOneAssignmentNameIsNotBlank(
    val message: String = "At least one of the name fields must be non-empty",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class AtLeastOneAssignmentNameIsNotEmptyValidator : ConstraintValidator<AtLeastOneAssignmentNameIsNotBlank, Assignment> {
    override fun isValid(value: Assignment, context: ConstraintValidatorContext?): Boolean {
        return value.nameFi.isNotEmpty() || value.nameSv.isNotEmpty()
    }
}
