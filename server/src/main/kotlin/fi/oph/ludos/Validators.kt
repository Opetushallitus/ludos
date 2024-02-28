package fi.oph.ludos

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.Size
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import org.slf4j.Logger
import org.slf4j.LoggerFactory
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
@Constraint(validatedBy = [])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@SafeHtmlList
@ValidStringLengths(min = 0, max = 1000000)
@Size(min = 0, max = 100)
annotation class ValidHtmlContentList(
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

val htmlSafelist: Safelist = Safelist.relaxed()
    .addAttributes(":all", "class")
    .addAttributes("a", "href", "target", "rel")
    .removeProtocols("img", "src", "http", "https")

class SafeHtmlValidator : ConstraintValidator<SafeHtml, String> {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    override fun isValid(input: String?, context: ConstraintValidatorContext?): Boolean {
        if (input == null) return true
        return Jsoup.isValid(input, htmlSafelist)
    }
}

@MustBeDocumented
@Constraint(validatedBy = [SafeHtmlListValidator::class])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.ANNOTATION_CLASS)
annotation class SafeHtmlList(
    val message: String = "Unsafe HTML content found",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class SafeHtmlListValidator : ConstraintValidator<SafeHtmlList, List<String>> {
    override fun isValid(input: List<String>?, context: ConstraintValidatorContext?): Boolean {
        if (input == null) return true
        return input.all { Jsoup.isValid(it, htmlSafelist) }
    }
}

@MustBeDocumented
@Constraint(validatedBy = [EmptyContentListValidator::class])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.ANNOTATION_CLASS)
annotation class EmptyContentField(
    val message: String = "Content must be empty",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class EmptyContentListValidator : ConstraintValidator<EmptyContentField, List<String>> {
    override fun isValid(input: List<String>, context: ConstraintValidatorContext?): Boolean {
        return input.size == 1 && input[0].isEmpty()
    }
}

const val MAX_FAVORITE_FOLDER_NAME_LENGTH = 200

@MustBeDocumented
@Constraint(validatedBy = [])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER)
@PlainText
@Size(min = 1, max = MAX_FAVORITE_FOLDER_NAME_LENGTH)
annotation class ValidFavoriteFolderName(
    val message: String = "",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)


@MustBeDocumented
@Constraint(validatedBy = [ListStringLengthValidator::class])
@Target(AnnotationTarget.FIELD, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.ANNOTATION_CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class ValidStringLengths(
    val min: Int = 0,
    val max: Int = Int.MAX_VALUE,
    val message: String = "Invalid string length",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class ListStringLengthValidator : ConstraintValidator<ValidStringLengths, List<String>> {

    private var min: Int = 0
    private var max: Int = Int.MAX_VALUE

    override fun initialize(constraintAnnotation: ValidStringLengths) {
        min = constraintAnnotation.min
        max = constraintAnnotation.max
    }

    override fun isValid(values: List<String>?, context: ConstraintValidatorContext?): Boolean {
        if (values == null) return true

        for (value in values) {
            if (value.length < min || value.length > max) {
                return false
            }
        }

        return true
    }
}