package fi.oph.ludos.assignment

import org.springframework.stereotype.Service

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(examType: ExamType): List<AssignmentOut> {
        return db.getSukoAssignments(examType)
    }

    fun createAssignment(assignment: Assignment): AssignmentOut {
        return when (assignment) {
            is SukoAssignmentDtoIn -> db.saveSukoAssignment(assignment)
            is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
            is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
            else -> throw UnknownError("Unreachable")
        }
    }

    fun getAssignmentById(id: Int): AssignmentOut {
        return db.getSukoAssignment(id)
    }
}