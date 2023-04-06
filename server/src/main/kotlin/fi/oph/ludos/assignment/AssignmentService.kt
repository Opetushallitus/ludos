package fi.oph.ludos.assignment

import org.springframework.stereotype.Service

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(examType: ExamType): List<AssignmentOut> = when (examType) {
        ExamType.SUKO -> db.getSukoAssignments()
        ExamType.PUHVI -> db.getPuhviAssignments()
        ExamType.LD -> db.getLdAssignments()
    }

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> db.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(examType: ExamType, id: Int): AssignmentOut = when (examType) {
        ExamType.SUKO -> db.getSukoAssignmentById(id)
        ExamType.PUHVI -> db.getPuhviAssignmentById(id)
        ExamType.LD -> db.getLdAssignmentById(id)
    }
}