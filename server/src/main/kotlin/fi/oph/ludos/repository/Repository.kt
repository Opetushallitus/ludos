package fi.oph.ludos.repository

import java.sql.ResultSet
import java.time.ZoneId
import java.time.ZonedDateTime

inline fun <reified T> ResultSet.getKotlinArray(columnLabel: String): Array<T> {
    val array = this.getArray(columnLabel)?.array ?: return emptyArray()

    @Suppress("UNCHECKED_CAST") return array as Array<T>
}

fun ResultSet.getZonedDateTime(columnLabel: String): ZonedDateTime {
    return ZonedDateTime.ofInstant(this.getTimestamp(columnLabel).toInstant(), ZoneId.systemDefault())
}

