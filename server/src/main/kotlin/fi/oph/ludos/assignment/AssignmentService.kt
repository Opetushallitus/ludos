package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import fi.oph.ludos.ExamType
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AssignmentService(val db: AssignmentRepository) {
    fun getAssignments(exam: Exam, examType: ExamType?, filters: AssignmentFilter?): List<AssignmentOut> = when (exam) {
        Exam.SUKO -> db.getSukoAssignments(examType, filters)
        Exam.PUHVI -> db.getPuhviAssignments(examType, filters)
        Exam.LD -> db.getLdAssignments(examType, filters)
    }

    fun createAssignment(assignment: Assignment): AssignmentOut = when (assignment) {
        is SukoAssignmentDtoIn -> db.saveSukoAssignment(assignment)
        is PuhviAssignmentDtoIn -> db.savePuhviAssignment(assignment)
        is LdAssignmentDtoIn -> db.saveLdAssignment(assignment)
        else -> throw UnknownError("Unreachable")
    }

    fun getAssignmentById(exam: Exam, id: Int): AssignmentOut = when (exam) {
        Exam.SUKO -> {
            try {
                db.getSukoAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.PUHVI -> {
            try {
                db.getPuhviAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }

        Exam.LD -> {
            try {
                db.getLdAssignmentById(id)
            } catch (e: NotFoundException) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }
    }

    fun updateAssignment(exam: Exam, id: Int, assignment: UpdateAssignmentDtoIn): Int {
        return when (exam) {
            Exam.SUKO -> {
                try {
                    db.updateSukoAssignment(assignment as SukoUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }

            Exam.PUHVI -> {
                try {
                    db.updatePuhviAssignment(assignment as PuhviUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }

            Exam.LD -> {
                try {
                    db.updateLdAssignment(assignment as LdUpdateAssignmentDtoIn, id)
                } catch (e: NotFoundException) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
                }
            }
        }
    }
}