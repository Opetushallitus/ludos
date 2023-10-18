package fi.oph.ludos.assignment

import BaseFilters
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.*
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import fi.oph.ludos.koodisto.ValidKoodiArvos
import fi.oph.ludos.koodisto.ValidOppimaara
import jakarta.validation.*
import jakarta.validation.constraints.Pattern
import java.sql.Timestamp
import kotlin.reflect.KClass

@ValidOppimaara
data class Oppimaara(
    val oppimaaraKoodiArvo: String,
    val kielitarjontaKoodiArvo: String? = null
) : Comparable<Oppimaara> {
    override fun compareTo(other: Oppimaara): Int {
        val oppimaaraOrder = oppimaaraKoodiArvo.compareTo(other.oppimaaraKoodiArvo)
        return if (oppimaaraOrder != 0) {
            oppimaaraOrder
        } else if (kielitarjontaKoodiArvo == null && other.kielitarjontaKoodiArvo == null) {
            0
        } else if (kielitarjontaKoodiArvo == null || other.kielitarjontaKoodiArvo == null) {
            if (kielitarjontaKoodiArvo == null) -1 else 1 // sort parent before child
        } else {
            kielitarjontaKoodiArvo.compareTo(other.kielitarjontaKoodiArvo)
        }

    }
}

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

    @get:ValidContentDescription
    val instructionFi: String

    @get:ValidContentDescription
    val instructionSv: String

    @get:ValidHtmlContentArray
    val contentFi: Array<String>

    @get:ValidHtmlContentArray
    val contentSv: Array<String>
    val publishState: PublishState

    @get:ValidKoodiArvos(koodisto = KoodistoName.LAAJA_ALAINEN_OSAAMINEN_LOPS2021)
    val laajaalainenOsaaminenKoodiArvos: Array<String>
    val exam: Exam
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_SUKO)
    val assignmentTypeKoodiArvo: String,
    @field:Valid
    val oppimaara: Oppimaara,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TAITOTASO)
    @JsonProperty(required = true)
    val tavoitetasoKoodiArvo: String?,
    @field:ValidKoodiArvos(koodisto = KoodistoName.AIHE_SUKO)
    val aiheKoodiArvos: Array<String>,
    override val exam: Exam = Exam.SUKO,
) : Assignment

@JsonTypeName("LD")
data class LdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    val lukuvuosiKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD,
) : Assignment

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_PUHVI)
    val assignmentTypeKoodiArvo: String,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    val lukuvuosiKoodiArvos: Array<String>,
    override val exam: Exam = Exam.PUHVI,
) : Assignment

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoOut::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoOut::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoOut::class, name = "LD")
)
interface AssignmentOut : Assignment {
    val id: Int
    val authorOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
    val isFavorite: Boolean
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    val assignmentTypeKoodiArvo: String,
    val oppimaara: Oppimaara,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
    override val exam: Exam = Exam.SUKO
) : AssignmentOut

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
    override val exam: Exam = Exam.PUHVI
) : AssignmentOut

@JsonTypeName("LD")
data class LdAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : AssignmentOut

interface AssignmentBaseFilters : BaseFilters {
    override val jarjesta: String?
    override val sivu: Int
    val suosikki: Boolean?
}

data class SukoFilters(
    override val jarjesta: String?,
    override val suosikki: Boolean?,
    @field:Pattern(regexp = "^([A-Z0-9]+(\\.[A-Z0-9]+)?)(,[A-Z0-9]+(\\.[A-Z0-9]+)?)*\$")
    val oppimaara: String?,
    // format OPPIMAARAKOODIARVO or OPPIMAARAKOODIARVO.KIELITARJONTAKOODIARVO
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppisuko: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aihe: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tavoitetaitotaso: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

data class LdFilters(
    override val jarjesta: String?,
    override val suosikki: Boolean?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aine: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

data class PuhviFilters(
    override val jarjesta: String?,
    override val suosikki: Boolean?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppipuhvi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AtLeastOneAssignmentNameIsNotEmptyValidator::class])
annotation class AtLeastOneAssignmentNameIsNotBlank(
    val message: String = "At least one of the name fields must be non-empty",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class AtLeastOneAssignmentNameIsNotEmptyValidator :
    ConstraintValidator<AtLeastOneAssignmentNameIsNotBlank, Assignment> {
    override fun isValid(value: Assignment, context: ConstraintValidatorContext?): Boolean {
        return value.nameFi.isNotEmpty() || value.nameSv.isNotEmpty()
    }
}

data class SetFavoriteRequest(val suosikki: Boolean)

data class AssignmentFilterOptionsDtoOut(
    val oppimaara: List<Oppimaara>? = null,
    val tehtavatyyppi: List<String>? = null,
    val aihe: List<String>? = null,
    val tavoitetaitotaso: List<String>? = null,
    val lukuvuosi: List<String>? = null,
    val aine: List<String>? = null,
)

data class AssignmentListDtoOut(
    val content: List<AssignmentOut>,
    val totalPages: Int,
    val currentPage: Int,
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut
)

const val ASSIGNMENT_PAGE_SIZE = 20