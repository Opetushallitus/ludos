package fi.oph.ludos

import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import javax.validation.Constraint
import javax.validation.ConstraintValidator
import javax.validation.ConstraintValidatorContext
import javax.validation.Payload
import javax.validation.constraints.Size
import kotlin.reflect.KClass

@MustBeDocumented
@Constraint(validatedBy = [])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@PlainText
@Size(min = 0, max = 1000)
annotation class ValidContentName(
    val message: String = "",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

@MustBeDocumented
@Constraint(validatedBy = [])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@PlainText
@Size(min = 0, max = 20000)
annotation class ValidContentDescription(
    val message: String = "",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

@MustBeDocumented
@Constraint(validatedBy = [])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@SafeHtml
@Size(min = 0, max = 1000000)
annotation class ValidHtmlContent(
    val message: String = "",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

@MustBeDocumented
@Constraint(validatedBy = [PlainTextValidator::class])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.ANNOTATION_CLASS)
annotation class PlainText(
    val message: String = "Non-plain content found",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)
class PlainTextValidator : ConstraintValidator<PlainText, String> {
    override fun isValid(input: String?, context: ConstraintValidatorContext?): Boolean {
        if (input == null) return true
        return Jsoup.isValid(input, Safelist.none())
    }
}

@MustBeDocumented
@Constraint(validatedBy = [SafeHtmlValidator::class])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.ANNOTATION_CLASS)
annotation class SafeHtml(
    val message: String = "Unsafe HTML content found",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)
class SafeHtmlValidator : ConstraintValidator<SafeHtml, String> {
    private val safeList = Safelist.relaxed().addAttributes(":all", "class")

    override fun isValid(input: String?, context: ConstraintValidatorContext?): Boolean {
        if (input == null) return true
        return Jsoup.isValid(input, safeList)
    }
}
