package fi.oph.ludos

fun validateExamValue(exam: Exam) {
    val validExams = setOf(Exam.SUKO, Exam.PUHVI, Exam.LD)
    if (exam !in validExams) {
        throw IllegalArgumentException("Invalid exam value: $exam")
    }
}