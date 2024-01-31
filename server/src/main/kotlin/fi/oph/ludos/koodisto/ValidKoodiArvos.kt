package fi.oph.ludos.koodisto

import fi.oph.ludos.assignment.Oppimaara
import jakarta.validation.Constraint
import kotlin.reflect.KClass

@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [KoodiArvosValidator::class])
annotation class ValidKoodiArvos(
    val message: String = "Invalid KoodiArvos",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<*>> = [],
    val koodisto: KoodistoName
)

class KoodiArvosValidator(private val koodistoService: KoodistoService) :
    jakarta.validation.ConstraintValidator<ValidKoodiArvos, List<String>> {
    private lateinit var koodistoName: KoodistoName

    override fun initialize(constraintAnnotation: ValidKoodiArvos) {
        koodistoName = constraintAnnotation.koodisto
    }

    override fun isValid(value: List<String>, context: jakarta.validation.ConstraintValidatorContext?): Boolean {
        return koodistoService.isKoodiArvosInKoodisto(koodistoName, value)
    }
}

@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [KoodiArvoValidator::class])
annotation class ValidKoodiArvo(
    val message: String = "Invalid KoodiArvo",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<*>> = [],
    val koodisto: KoodistoName
)

class KoodiArvoValidator(private val koodistoService: KoodistoService) :
    jakarta.validation.ConstraintValidator<ValidKoodiArvo, String?> {
    private lateinit var koodistoName: KoodistoName

    override fun initialize(constraintAnnotation: ValidKoodiArvo) {
        koodistoName = constraintAnnotation.koodisto
    }

    override fun isValid(value: String?, context: jakarta.validation.ConstraintValidatorContext?): Boolean {
        return value === null || koodistoService.isKoodiArvoInKoodisto(koodistoName, value)
    }
}

@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [OppimaaraValidator::class])
annotation class ValidOppimaara(
    val message: String = "Invalid Oppimaara",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<*>> = [],
)

class OppimaaraValidator(private val koodistoService: KoodistoService) :
    jakarta.validation.ConstraintValidator<ValidOppimaara, Oppimaara?> {

    override fun isValid(value: Oppimaara?, context: jakarta.validation.ConstraintValidatorContext?): Boolean {
        if (value == null) {
            return true
        }
        val oppimaaraKoodi = koodistoService.getKoodi(
            KoodistoName.OPPIAINEET_JA_OPPIMAARAT_LOPS2021,
            KoodistoLanguage.FI,
            value.oppimaaraKoodiArvo
        )
        if (oppimaaraKoodi == null) {
            context?.disableDefaultConstraintViolation()
            context?.buildConstraintViolationWithTemplate("oppimaaraKoodiArvo '${value.oppimaaraKoodiArvo}' not found in ${KoodistoName.OPPIAINEET_JA_OPPIMAARAT_LOPS2021}")
                ?.addConstraintViolation()
            return false
        }
        if (value.kielitarjontaKoodiArvo != null) {
            if (oppimaaraKoodi.tarkenteet == null) {
                context?.disableDefaultConstraintViolation()
                context?.buildConstraintViolationWithTemplate("kielitarjontaKoodiArvo '${value.kielitarjontaKoodiArvo}' given but '${value.oppimaaraKoodiArvo}' does not contain tarkenteet")
                    ?.addConstraintViolation()
                return false
            }
            if (!oppimaaraKoodi.tarkenteet.contains(value.kielitarjontaKoodiArvo)) {
                context?.disableDefaultConstraintViolation()
                context?.buildConstraintViolationWithTemplate("kielitarjontaKoodiArvo '${value.kielitarjontaKoodiArvo}' not valid for '${value.oppimaaraKoodiArvo}'. Valid options: ${oppimaaraKoodi.tarkenteet}")
                    ?.addConstraintViolation()
                return false
            }
        }
        return true
    }
}
