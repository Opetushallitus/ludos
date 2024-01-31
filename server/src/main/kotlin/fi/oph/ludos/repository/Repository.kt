package fi.oph.ludos.repository

import java.sql.ResultSet

inline fun <reified T> ResultSet.getKotlinArray(columnLabel: String): Array<T> {
    val array = this.getArray(columnLabel)?.array ?: return emptyArray()

    @Suppress("UNCHECKED_CAST") return array as Array<T>
}

inline fun <reified T> ResultSet.getKotlinList(columnLabel: String): List<T> {
    return this.getKotlinArray<T>(columnLabel).toList()
}
