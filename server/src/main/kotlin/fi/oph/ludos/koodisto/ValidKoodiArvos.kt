package fi.oph.ludos.koodisto

import javax.validation.Constraint
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
    javax.validation.ConstraintValidator<ValidKoodiArvos, Array<String>> {
    private lateinit var koodistoName: KoodistoName

    override fun initialize(constraintAnnotation: ValidKoodiArvos) {
        koodistoName = constraintAnnotation.koodisto
    }

    override fun isValid(value: Array<String>, context: javax.validation.ConstraintValidatorContext?): Boolean {
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
    javax.validation.ConstraintValidator<ValidKoodiArvo, String?> {
    private lateinit var koodistoName: KoodistoName

    override fun initialize(constraintAnnotation: ValidKoodiArvo) {
        koodistoName = constraintAnnotation.koodisto
    }

    override fun isValid(value: String?, context: javax.validation.ConstraintValidatorContext?): Boolean {
        return value === null || koodistoService.isKoodiArvoInKoodisto(koodistoName, value)
    }
}