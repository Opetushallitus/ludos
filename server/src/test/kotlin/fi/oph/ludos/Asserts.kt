package fi.oph.ludos

import org.junit.jupiter.api.Assertions.assertTrue
import java.sql.Timestamp
import java.time.Duration
import java.time.ZoneId
import java.time.ZonedDateTime

fun assertTimeIsRoughlyBetween(
    before: ZonedDateTime,
    time: ZonedDateTime,
    after: ZonedDateTime,
    timeName: String
) {
    // Tolerance is required for createdAt and updatedAt asserts in @Transactional tests because
    // in content creation those columns will be populated with now() which does not change inside a transaction.
    // So createdAt and updatedAt will initially be the start time of the test and NOT insertion time of row.
    val tolerance = Duration.ofMillis(5)
    val (beforeMinusTolerance, afterPlusTolerance) = Pair(before.minus(tolerance), after.plus(tolerance))
    assertTrue(
        time >= beforeMinusTolerance && time <= afterPlusTolerance,
        "Time ${timeName} ${time} is not between ${beforeMinusTolerance} and ${afterPlusTolerance}"
    )
}

fun assertTimeIsRoughlyBetween(before: ZonedDateTime, isotime: String, after: ZonedDateTime, timeName: String) =
    assertTimeIsRoughlyBetween(before, ZonedDateTime.parse(isotime), after, timeName)

fun assertTimeIsRoughlyBetween(before: ZonedDateTime, timestamp: Timestamp, after: ZonedDateTime, timeName: String) =
    assertTimeIsRoughlyBetween(before, ZonedDateTime.ofInstant(timestamp.toInstant(), ZoneId.systemDefault()), after, timeName)
