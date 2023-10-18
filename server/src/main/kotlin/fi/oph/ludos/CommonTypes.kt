import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Pattern

// NOTE: This enum must match the postgres enum type language
enum class Language {
    FI,
    SV
}

interface BaseFilters {
    @get:Pattern(regexp = "^(asc|desc)\$")
    val jarjesta: String?

    @get:Min(1)
    val sivu: Int
}
